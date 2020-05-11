import * as WebSocket from "ws";
import Dispatcher from "../common/Dispatcher";
import { WsResponse, WsResponseType } from "../common/WsResponse";
import WsRequest from "../common/WsRequest";

export interface WsServerAction {
  (sender: string, params: any): any;
}
/**
 * This class implements a remoting server.
 * Use this to realtime expose functionality to any app you choose.
 */
export class WsServer {
  private server: WebSocket.Server;
  public actions: Dispatcher = new Dispatcher();
  /**
   * This method parses a received messagae as JSON and takes the appropriate action.
   * If it fails, a message is sent back to the client with no id but a failMessage.
   *
   * @param ws
   * @param message
   */
  private receiveRequest(ws: any, message: string) {
    //console.log(ws.id, message);
    const response: WsResponse = new WsResponse();
    try {
      const request: WsRequest = JSON.parse(message);
      if (!request.id) {
        response.responseType = WsResponseType.ERROR;
        response.error =
          "You need to provide a message id to track the result.";
      } else {
        response.id = request.id;
        if (!request.action) {
          response.responseType = WsResponseType.ERROR;
          response.error = "Your message needs to have an 'action' attribute.";
        } else {
          const action: WsServerAction = this.actions[request.action];
          if (!action) {
            response.responseType = WsResponseType.ERROR;
            response.error = "Action not found: " + request.action;
          } else {
            response.result = action(ws.id, request.params);
            response.responseType = WsResponseType.SUCCESS;
          }
        }
      }
    } catch (error) {
      response.error = error.toString();
      response.responseType = WsResponseType.ERROR;
    }
    ws.send(JSON.stringify(response));
  }

  /**
   * This method handles a connection and binds listeners.
   * The message event will raise a handle message call.
   * This close even will delete the listener from the list of clients.
   */
  private handleConnection = (ws: any, req: any): void => {
    ws.id = req.headers["sec-websocket-key"];
    console.log("connected client", ws.id);
    ws.on("message", (message: string) => {
      this.receiveRequest(ws, message);
    });
    ws.on("close", () => {
      console.log("disconnected client", ws.id);
    });
  };

  /**
   * This method broadcasts a message to all sockets connected.
   * Optionally you can ignore the specific client id that sent the original message.
   *
   * @param action
   * @param params
   * @param ignore
   */
  broadcast(
    action: string,
    result: any,
    ignore: string | undefined = undefined
  ): void {
    const broadmsg = JSON.stringify({
      responseType: WsResponseType.BROADCAST,
      action: action,
      result: result,
    });
    this.server.clients.forEach((client: any) => {
      if (!ignore || ignore !== client.id) {
        client.send(broadmsg);
      }
    });
  }

  /**
   * This method registers an action that can be called over a websocket.
   *
   * @param action
   * @param fn
   */
  register(action: string, fn: WsServerAction): void {
    this.actions[action] = fn;
  }

  /**
   * This method deletes an action that can be called of a websocket.
   *
   * @param action
   */
  unregister(action: string) {
    delete this.actions[action];
  }

  /**
   * This constructor initializes the class and creates a new WebSocket server.
   * @param params
   */
  constructor(options: WebSocket.ServerOptions) {
    this.server = new WebSocket.Server(options);
    this.server.on("connection", this.handleConnection);
  }
}
