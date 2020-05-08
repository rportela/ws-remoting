import WsRemotingMessage from "./WsRemotingMessage";

/**
 * This class handles WebSocket connections and
 * remote procedure invokations on a remote server.
 *
 * @author Rodrigo Portela
 */
export default class WsRemotingClient {
  /**
   * The url of the remote server to connect to.
   */
  url: string;
  /**
   * The handle of the web socket.
   */
  socket: WebSocket | null = null;
  /**
   * Indicates that the web socket is trying to connect.
   */
  is_connecting = false;
  /**
   * Indicates that the web socket is connected.
   */
  is_connected = false;
  /**
   * The remoting message buffer that accomodate calls even when the socket is not connected.
   */
  buffer: any = {};
  /**
   * The reconnect interval event timer.
   */
  reconnectInterval: number | undefined;
  /**
   * A collection of broadcast listeners for messages that are broadcasted from the server.
   */
  broadcastListeners: any = {};

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
    this.socket.onmessage = this.handleMessage;
    this.socket.onclose = this.handleDisconnect;
  }

  /**
   * This method handles the connection and flushes any remoting messages present on the buffer.
   */
  private handleConnect = (socket: any): void => {
    this.is_connected = true;
    this.is_connecting = false;
    for (let key of Object.keys(this.buffer)) {
      const message: WsRemotingMessage = this.buffer[key];
      if (!message.sent_at) {
        message.sent_at = new Date();
        this.socket?.send(JSON.stringify(message));
      }
    }
  };

  /**
   * This method handles an error.
   * TODO: make sure promises are rejected and something is actually done here.
   */
  private handleError = (ev: Event): void => {
    console.error(ev.target);
  };

  /**
   * Handles a disconnection and try again every 2 seconds to reconnect.
   * TODO: make interval configurable.
   */
  private handleDisconnect = (ev: CloseEvent): void => {
    this.is_connected = false;
    this.is_connecting = false;
    console.log(
      "socket disconnected, will try to reconnect",
      ev.reason,
      ev.returnValue
    );
    // else the socket will automatically try to reconnect
    this.reconnectInterval = window.setInterval(this.handleReAttempt, 2000);
  };

  /**
   * Handle an attempt to reconnect.
   */
  private handleReAttempt = () => {
    if (this.is_connected) {
      if (this.reconnectInterval) {
        window.clearInterval(this.reconnectInterval);
        this.reconnectInterval = undefined;
      }
    } else {
      this.connect();
    }
  };

  /**
   * This methods handles a broadcast message from the server.
   * TODO: Implement resolution of the broadcasted messages.
   * @param message
   */
  private handleBroadcast(action: string, message: any) {
    console.log("Received a broadcast", action, message);
    const callbacks: any[] = this.broadcastListeners[action];
    if (callbacks) for (const callback of callbacks) callback(message);
  }

  /**
   * Handle a message received.
   * This is the core of the remoting api.
   * It will call either the resolve or reject method of a promise stored on a WsRemotingMessage.
   */
  private handleMessage = (ev: MessageEvent) => {
    const json = JSON.parse(ev.data);
    if ("broadcast" === json.resultType) {
      this.handleBroadcast(json.action, json.result);
    } else {
      if (json.id) {
        const message: WsRemotingMessage = this.buffer[json.id];
        if ("success" === json.resultType) {
          message.resolve(json.result);
        } else {
          message.reject(new Error(json.failMessage));
        }
        delete this.buffer[json.id];
      } else {
        console.error("Message with no id: ", json);
      }
    }
  };

  /**
   * The public mehtod that exposes a remoting message.
   * This method creates a promise and makes sure the resolve and reject are binded to a WsRemotingMessage.
   *
   * @param action
   * @param params
   */
  public async call(action: string, params: any): Promise<any> {
    return new Promise((resolve, reject) => {
      const msg = new WsRemotingMessage(action, params, resolve, reject);
      this.buffer[msg.id] = msg;
      if (this.is_connected) {
        msg.sent_at = new Date();
        this.socket?.send(JSON.stringify(msg));
      }
    });
  }

  /**
   * This method allows a client to register for broadcasted messages from the server.
   * It will hook a specific method to a specific action broadcasted from the server.
   * @param action
   * @param callback
   */
  public register_broadcast(
    action: string,
    callback: (params: any) => void
  ): void {
    let fnarray: any[] = this.broadcastListeners[action];
    if (!fnarray) {
      fnarray = [];
      fnarray.push(callback);
      this.broadcastListeners[action] = fnarray;
    } else {
      if (fnarray.indexOf(callback) < 0) fnarray.push(callback);
    }
  }

  /**
   * This method unregisters a broadcast callback.
   * It locates a calling method for a given action and removes it from the callback array.
   * @param action
   * @param callback
   */
  public unregister_broadcast(
    action: string,
    callback: (params: any) => void
  ): void {
    const fnarray: any[] = this.broadcastListeners[action];
    if (fnarray) {
      const index = fnarray.indexOf(callback);
      if (index >= 0) fnarray.splice(index, 1);
    }
  }
}
