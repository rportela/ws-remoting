import { isRpcRequest, JsonRpc, JsonRpcRequest, JsonRpcResponse, SocketData } from "../common/JsonRpc2";
import Idb from "./ObservableDb";
import { ClientSocket, ClientSocketEventType } from "./WebSocketClient";

type ClientHandler = (params?: any) => void;

export default class ClientRpc {
  private notificationsdb: Idb;
  private socket: ClientSocket;
  private rpc: JsonRpc<ClientHandler>;
  private buffer: SocketData[] = [];

  constructor(address: string, protocols?: string | string[]) {
    this.rpc = new JsonRpc<ClientHandler>();
    this.notificationsdb = new Idb({
      name: "json_rpc",
      version: 1,
      collections: [
        {
          name: "notification",
          keyPath: "localId",
          autoIncrement: true,
        },
      ],
    });
    this.socket = new ClientSocket(address, protocols);
    this.socket.on(ClientSocketEventType.MESSAGE, this.onMessage);
    this.socket.on(ClientSocketEventType.ERROR, this.onError);
    this.socket.on(ClientSocketEventType.ATTEMPT, this.onAttempt);
    this.socket.on(ClientSocketEventType.CONNECT, this.onConnect);
    this.socket.on(ClientSocketEventType.DISCONNECT, this.onDisconnect);
  }

  private runHandler(method: string, params?: any): any {
    const handler: ClientHandler = this.rpc.getHandler(method);
    return handler ? handler(params) : undefined;
  }

  private onDisconnect = (params?: any) => {
    this.runHandler(ClientSocketEventType.DISCONNECT, params);
  };

  private flushBuffer() {
    const pending: SocketData[] = this.buffer;
    this.buffer = [];
    pending.forEach(this.socket.send);
  }

  private flushNotification = (notification: any): void => {
    this.rpc.notify(this.socket.send, notification.method, notification.params);
    this.notificationsdb.delete("notification", notification.localId);
  };

  private flushNotifications() {
    this.notificationsdb
      .all("notification")
      .then((arr: any[]) => arr.forEach(this.flushNotification))
      .catch(this.onError);
  }

  private onConnect = (params?: any) => {
    this.flushBuffer();
    this.flushNotifications();
    this.runHandler(ClientSocketEventType.CONNECT, params);
  };

  private onAttempt = (params?: any) => {
    this.runHandler(ClientSocketEventType.ATTEMPT, params);
  };

  private onError = (err: any): void => {
    this.rpc.raiseError(err);
  };

  private onMessage = (data: SocketData): void => {
    const msg: JsonRpcRequest | JsonRpcResponse = JSON.parse(data.toString());
    if (isRpcRequest(msg)) {
      const req: JsonRpcRequest = msg;
      if (req.id) {
        try {
          const result = this.runHandler(req.method, req.params);
          if (result && result.then)
            result
              .then((result) => this.reply(req, undefined, result))
              .catch((err) => this.reply(req, err, undefined));
          else this.reply(req, undefined, result);
        } catch (e) {
          this.reply(req, e, undefined);
        }
      } else {
        try {
          this.runHandler(req.method, req.params);
        } catch (e) {
          this.rpc.raiseError(e);
        }
      }
    } else {
      this.rpc.resolve(msg);
    }
  };

  private reply(req: JsonRpcRequest, error: any, result: any): void {
    const resp: JsonRpcResponse = {
      id: req.id,
      jsonrpc: req.jsonrpc,
      error: error,
      result: result,
    };
    this.sendMessage(resp);
  }

  protected sendMessage(message: JsonRpcRequest | JsonRpcResponse): void {
    const json = JSON.stringify(message);
    if (this.socket.isConnected()) this.socket.send(json);
    else this.buffer.push(json);
  }

  call(method: string, params?: any): Promise<any> {
    return this.rpc.call(
      this.socket.isConnected()
        ? this.socket.send
        : (json) => this.buffer.push(json),
      method,
      params
    );
  }

  notify(method: string, params?: any): void {
    if (this.socket.isConnected())
      this.rpc.notify(this.socket.send, method, params);
    else {
      this.notificationsdb.add("notification", {
        method: method,
        params: params,
        createdAt: new Date(),
      });
    }
  }

  setHandler(method: string, handler: ClientHandler) {
    this.rpc.setHandler(method, handler);
  }

  removeHandler(method: string) {
    this.rpc.removeHandler(method);
  }
}
