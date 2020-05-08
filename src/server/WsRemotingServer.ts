import * as WebSocket from "ws";

/**
 * This class implements a remoting server.
 * Use this to realtime expose functionality to any app you choose.
 */
export default class WsRemotingServer {
  private server: WebSocket.Server;
  private actions: any = {};

  /**
   * This method sends a parameterized error message to the clients.
   * When received, they should reject their promises.
   *
   * @param ws
   * @param id
   * @param failMessage
   */
  private sendError(ws: any, id: any, failMessage: any) {
    ws.send(
      JSON.stringify({
        id: id,
        resultType: "error",
        failMessage: failMessage,
      })
    );
  }

  /**
   * This method sends a parameterized success message to the clients.
   * When received, they should resolve their promises.
   *
   * @param ws
   * @param id
   * @param result
   */
  private sendSuccess(ws: any, id: any, result: any) {
    ws.send(
      JSON.stringify({
        id: id,
        resultType: "success",
        result: result,
      })
    );
  }

  /**
   * This method parses a received messagae as JSON and takes the appropriate action.
   * If it fails, a message is sent back to the client with no id but a failMessage.
   *
   * @param ws
   * @param message
   */
  private handleMessage(ws: any, message: string) {
    //console.log(ws.id, message);
    try {
      const json = JSON.parse(message);
      if (!json.id) {
        this.sendError(
          ws,
          json.id,
          "You need to provide a message id to track the result."
        );
      } else if (!json.action) {
        this.sendError(
          ws,
          json.id,
          "Your message needs to have an 'action' attribute."
        );
      } else {
        const action = this.actions[json.action];
        if (!action) {
          this.sendError(ws, json.id, "Action not found: " + json.action);
        } else {
          this.sendSuccess(ws, json.id, action(ws.id, json.params));
        }
      }
    } catch (error) {
      this.sendError(ws, null, error.message);
    }
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
      this.handleMessage(ws, message);
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
    params: any,
    ignore: string | undefined = undefined
  ): void {
    const broadmsg = JSON.stringify({
      resultType: "broadcast",
      action: action,
      result: params,
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
  register(action: string, fn: (source: string, params: any) => any): void {
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
