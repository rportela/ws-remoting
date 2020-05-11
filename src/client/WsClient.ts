import Dispatcher from "../common/Dispatcher";
import WsRequest from "../common/WsRequest";
import { WsResponse, WsResponseType } from "../common/WsResponse";

export const WsClientAction = {
  CONNECT: "CONNECT",
  DISCONNECT: "DISCONNECT",
  ERROR: "ERROR",
};

/**
 * This class handles WebSocket connections and
 * remote procedure invocations on a remote server.
 *
 * @author Rodrigo Portela
 */
export class WsClient {
  private url: string;
  private socket: WebSocket | null = null;
  private is_connecting = false;
  private is_connected = false;
  private buffer: any = {};
  reconnectInterval: number = 5000;
  private reconnectHandle: number | undefined;
  private listeners = new Dispatcher();

  /**
   * The standard constructor. This method already tries to connect to the remoting server.
   * @param url
   */
  constructor(url: string) {
    this.url = url;
    this.connect();
  }

  /**
   * This method connects this client to a remoting server when no connection is present.
   * If a socket is already present, this method does nothing.
   */
  public connect() {
    if (this.is_connecting) return;
    if (this.is_connected) return;
    this.is_connecting = true;
    this.socket = new WebSocket(this.url);
    this.socket.onopen = this.handleConnect;
    this.socket.onerror = this.handleError;
    this.socket.onmessage = this.receiveResponse;
    this.socket.onclose = this.handleDisconnect;
  }

  /**
   * This method handles the connection and flushes any remoting messages present on the buffer.
   */
  private handleConnect = (): void => {
    this.is_connected = true;
    this.is_connecting = false;
    for (let key of Object.keys(this.buffer)) {
      const message: WsRequest = this.buffer[key];
      if (!message.sent_at) {
        message.sent_at = new Date();
        this.socket?.send(JSON.stringify(message));
      }
    }
    this.listeners.dispatch(WsClientAction.CONNECT, this);
  };

  /**
   * This method handles an error.
   * TODO: make sure promises are rejected and something is actually done here.
   */
  private handleError = (ev: Event): void => {
    console.error(ev.target);
    this.listeners.dispatch(WsClientAction.ERROR, this);
  };

  /**
   * Handles a disconnection and try again every 2 seconds to reconnect.
   * TODO: make interval configurable.
   */
  private handleDisconnect = (ev: CloseEvent): void => {
    this.is_connected = false;
    this.is_connecting = false;
    console.log("socket disconnected, will try to reconnect", ev.reason);
    this.listeners.dispatch(WsClientAction.DISCONNECT, this);
    this.reconnectHandle = window.setInterval(
      this.handleReAttempt,
      this.reconnectInterval
    );
  };

  /**
   * Handle an attempt to reconnect.
   */
  private handleReAttempt = () => {
    if (this.is_connected) {
      if (this.reconnectHandle) {
        window.clearInterval(this.reconnectHandle);
        this.reconnectHandle = undefined;
      }
    } else {
      this.connect();
    }
  };

  /**
   * Handle a message received.
   * This is the core of the remoting api.
   * It will call either the resolve or reject method of a promise stored on a WsMessage.
   */
  private receiveResponse = (ev: MessageEvent) => {
    const response: WsResponse = JSON.parse(ev.data);
    if (WsResponseType.BROADCAST === response.responseType) {
      this.listeners.dispatch(response.action, response.result);
    } else {
      if (response.id) {
        const message: WsRequest = this.buffer[response.id];
        if (WsResponseType.SUCCESS === response.responseType) {
          message.resolve(response.result);
        } else {
          message.reject(new Error(response.error));
        }
        delete this.buffer[response.id];
      } else {
        console.error(response);
        console.trace();
      }
    }
  };

  /**
   * The public mehtod that exposes a remoting message.
   * This method creates a promise and makes sure the resolve and reject are binded to a WsMessage.
   *
   * @param action
   * @param params
   */
  public async call(action: string, params: any): Promise<any> {
    return new Promise((resolve, reject) => {
      const msg = new WsRequest(action, params, resolve, reject);
      this.buffer[msg.id] = msg;
      if (this.is_connected) {
        msg.sent_at = new Date();
        this.socket?.send(JSON.stringify(msg));
      }
    });
  }

  /**
   * Ads a new listener to events dispatched by this instance.
   *
   * @param action
   * @param listener
   */
  addListener(action: string, listener: (params: any) => void) {
    this.listeners.register(action, listener);
  }

  /**
   * Removes a listener from events dispatched by this instance.
   *
   * @param action
   * @param listener
   */
  removeListener(action: string, listener: (params: any) => void) {
    this.listeners.unregister(action, listener);
  }
}
