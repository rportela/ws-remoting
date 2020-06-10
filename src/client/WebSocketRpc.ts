import {
  isRpcRequest,
  JsonRpc,
  JsonRpcRequest,
  JsonRpcResponse,
  SocketData,
} from "../common/JsonRpc2";
import BrowserDb from "./BrowserDb";
import { WebSocketClient, WebSocketEventType } from "./WebSocketClient";

export default class WebSocketRpc {
  private buffer: SocketData[] = [];
  private rpc: JsonRpc = new JsonRpc();
  private socket: WebSocketClient;
  private notificationDb: BrowserDb = new BrowserDb({
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

  constructor(
    address: string,
    protocols?: string | string[],
    reconnectInterval?: number
  ) {
    this.socket = new WebSocketClient(address, protocols, reconnectInterval);
    this.socket.on(WebSocketEventType.CONNECT, this.onSocketConnect);
    this.socket.on(WebSocketEventType.MESSAGE, this.onMessage);
  }

  private onSocketConnect = () => {
    this.flushBuffer();
    this.flushNotifications();
  };

  private flushBuffer() {
    const pending: SocketData[] = this.buffer;
    this.buffer = [];
    pending.forEach(this.send);
  }

  private flushNotifications() {
    this.notificationDb.forEach(
      "notification",
      (cursor: IDBCursorWithValue) => {
        const notification = cursor.value;
        this.socket.send(JSON.stringify(notification));
        cursor.delete();
        cursor.continue();
      }
    );
  }

  protected onMessage = (event: MessageEvent) => {
    const data = event.data;
    const msg: JsonRpcRequest = JSON.parse(data as string);
    if (isRpcRequest(msg)) {
      const req: JsonRpcRequest = msg;
      if (req.id)
        this.rpc
          .run(req.method, req.params)
          .then((result: any) => {
            const resp: JsonRpcResponse = {
              id: req.id,
              jsonrpc: req.jsonrpc,
              result: result,
            };
            if (this.socket.isConnected())
              this.socket.send(JSON.stringify(resp));
            else this.notificationDb.add("notification", resp);
          })
          .catch((err: Error) => {
            const resp: JsonRpcResponse = {
              id: req.id,
              jsonrpc: req.jsonrpc,
              error: {
                code: -1,
                message: err.message,
                data: err.stack,
              },
            };
            if (this.socket.isConnected())
              this.socket.send(JSON.stringify(resp));
            else this.notificationDb.add("notification", resp);
          });
      else this.socket.emit(req.method, req.params);
    } else {
      this.rpc.resolve(msg);
    }
  };

  send = (data: SocketData): void => {
    if (this.socket.isConnected()) this.socket.send(data);
    else this.buffer.push(data);
  };

  setHandler(method: string, handler: (...params: any) => void) {
    this.rpc.setHandler(method, handler);
  }

  removeHandler(method: string) {
    this.rpc.removeHandler(method);
  }

  runHandler(method: string, ...params: any): Promise<any> {
    return this.rpc.run(method, params);
  }

  call(method: string, params?: any): Promise<any> {
    return this.rpc.call(this.send, method, params);
  }

  notify(method: string, params?: any): void {
    const msg: JsonRpcRequest = {
      id: null,
      jsonrpc: "2.0",
      method: method,
      params: params,
    };
    if (this.socket.isConnected()) this.socket.send(JSON.stringify(msg));
    else this.notificationDb.add("notification", msg);
  }

  on(event: string, listener: (params?: any) => void) {
    this.socket.on(event, listener);
  }

  off(event: string, listener: (params?: any) => void) {
    this.socket.off(event, listener);
  }

  emit(event: string, params?: any) {
    this.socket.emit(event, params);
  }
}
