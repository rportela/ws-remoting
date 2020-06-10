import * as http from "http";
import * as WebSocket from "ws";
import {
  isRpcRequest,
  JsonRpc,
  JsonRpcRequest,
  JsonRpcResponse,
  SocketData,
} from "../common/JsonRpc2";

/**
 *
 */
export enum JsonRpcEventType {
  CLIENT_CONNECT = "CLIENT_CONNECT",
  CLIENT_DISCONNECT = "CLIENT_DISCONNECT",
}

export type JsonRpcServerHandler = (
  socket: JsonRpcServerSocket,
  params?: any
) => any;

/**
 *
 */
export class JsonRpcServerSocket {
  server: JsonRpcServer;
  socket: WebSocket;
  id: string;
  info: http.IncomingHttpHeaders;

  constructor(
    server: JsonRpcServer,
    socket: WebSocket,
    message: http.IncomingMessage
  ) {
    this.info = message.headers;
    this.id = message.headers["sec-websocket-key"].toString();
    this.server = server;
    this.socket = socket;
    this.socket.on("close", this.onClose);
    this.socket.on("message", this.onMessage);
  }

  private onMessage = (data: SocketData): void => {
    const msg: JsonRpcRequest | JsonRpcResponse = JSON.parse(data.toString());
    if (isRpcRequest(msg)) {
      console.log("received a message request", this.id, msg);
      this.server.receiveSocketRequest(this, msg);
    } else {
      console.log("received a response message", this.id, msg);
      this.server.receiveSocketResponse(this, msg);
    }
  };

  private onClose = (): void => {
    this.server.unregisterClient(this);
  };

  send(data: any) {
    this.socket.send(data);
  }

  respond(req: JsonRpcRequest, err: any, result: any) {
    const resp: JsonRpcResponse = {
      id: req.id,
      jsonrpc: req.jsonrpc,
      error: err,
      result: result,
    };
    console.log("responding request", resp);
    const json = JSON.stringify(resp);
    this.socket.send(json);
  }

  call(method: string, params?: any): Promise<any> {
    return this.server.rpc.call(this.socket.send, method, params);
  }

  notify(method: string, params?: any): void {
    const req: JsonRpcRequest = {
      id: null,
      jsonrpc: "2.0",
      method: method,
      params: params,
    };
    const json = JSON.stringify(req);
    this.socket.send(json);
  }
}

export class JsonRpcServer {
  server: http.Server;
  socket: WebSocket.Server;
  rpc: JsonRpc;
  clients: JsonRpcServerSocket[] = [];

  constructor() {
    this.rpc = new JsonRpc();
    this.server = http.createServer(this.onHttpRequest);
    this.socket = new WebSocket.Server({ server: this.server });
    this.socket.on("connection", this.registerClient);
  }

  private registerClient = (ws: WebSocket, message: http.IncomingMessage) => {
    const client = new JsonRpcServerSocket(this, ws, message);
    this.clients.push(client);
    console.log("got a new client", client.info);
    this.run(JsonRpcEventType.CLIENT_CONNECT, client, client.info);
  };

  public unregisterClient(client: JsonRpcServerSocket) {
    const idx = this.clients.indexOf(client);
    if (idx >= 0) {
      this.clients.splice(idx, 1);
      console.log("lost a client", client.info);
      this.run(JsonRpcEventType.CLIENT_DISCONNECT, client, client.info);
    }
  }

  private onHttpRequest: http.RequestListener = (
    req: http.IncomingMessage,
    res: http.ServerResponse
  ) => {
    res.write("Hello World!");
    res.end();
  };

  run(method: string, client: JsonRpcServerSocket, params?: any): any {
    const handler = this.rpc.getHandler(method);
    return handler ? handler(client, params) : undefined;
  }

  receiveSocketResponse(
    client: JsonRpcServerSocket,
    response: JsonRpcResponse
  ) {
    this.rpc.resolve(response);
  }

  receiveSocketRequest(client: JsonRpcServerSocket, request: JsonRpcRequest) {
    if (request.id) {
      const handler = this.rpc.getHandler(request.method);
      if (handler) {
        try {
          const result = handler(client, request);
          if (result && result.then)
            result.then((r) => client.respond(request, undefined, r));
          else client.respond(request, undefined, result);
        } catch (err) {
          client.respond(request, err, undefined);
        }
      } else {
        client.respond(
          request,
          new Error("Method not found " + request.method),
          undefined
        );
      }
    } else {
      this.receiveSocketNotification(client, request);
    }
  }

  receiveSocketNotification(
    client: JsonRpcServerSocket,
    request: JsonRpcRequest
  ) {
    console.log("received a notification", request);
    const handler = this.rpc.getHandler(request.method);
    if (handler) handler(client, request.params);
  }

  listen(port: number = 1337) {
    this.server.listen(port);
  }

  getClient(websocketId: string): WebSocket {
    for (const ws of this.socket.clients)
      if (websocketId === ws["id"]) return ws;
    return null;
  }

  broadcast(method: string, params?: any, ignoreId?: string) {
    this.clients.forEach((ws: JsonRpcServerSocket) => {
      if (!ignoreId || ws.id !== ignoreId)
        this.rpc.notify(ws.send, method, params);
    });
  }

  notify(websocketId: string, method: string, params?: any): boolean {
    const client: WebSocket = this.getClient(websocketId);
    if (!client) return false;
    else {
      this.rpc.notify(client.send, method, params);
      return true;
    }
  }

  setHandler(method: string, handler: JsonRpcServerHandler) {
    this.rpc.setHandler(method, handler);
  }

  removeHandler(method: string) {
    this.rpc.removeHandler(method);
  }
}
