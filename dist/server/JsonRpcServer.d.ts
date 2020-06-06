/// <reference types="node" />
import * as http from "http";
import * as WebSocket from "ws";
import { JsonRpcRequest, JsonRpcResponse, JsonRpc } from "../common/JsonRpc2";
/**
 *
 */
export declare enum JsonRpcEventType {
    CLIENT_CONNECT = "CLIENT_CONNECT",
    CLIENT_DISCONNECT = "CLIENT_DISCONNECT"
}
export declare type JsonRpcServerHandler = (socket: JsonRpcServerSocket, params?: any) => any;
/**
 *
 */
export declare class JsonRpcServerSocket {
    server: JsonRpcServer;
    socket: WebSocket;
    id: string;
    info: http.IncomingMessage;
    constructor(server: JsonRpcServer, socket: WebSocket, message: http.IncomingMessage);
    private onMessage;
    private onClose;
    send(data: any): void;
    respond(req: JsonRpcRequest, err: any, result: any): void;
    call(method: string, params?: any): Promise<any>;
    notify(method: string, params?: any): void;
}
export declare class JsonRpcServer {
    server: http.Server;
    socket: WebSocket.Server;
    rpc: JsonRpc<JsonRpcServerHandler>;
    clients: JsonRpcServerSocket[];
    run(method: string, client: JsonRpcServerSocket, params?: any): any;
    private registerClient;
    unregisterClient(client: JsonRpcServerSocket): void;
    private onHttpRequest;
    constructor();
    receiveSocketResponse(client: JsonRpcServerSocket, response: JsonRpcResponse): void;
    receiveSocketRequest(client: JsonRpcServerSocket, request: JsonRpcRequest): void;
    receiveSocketNotification(client: JsonRpcServerSocket, request: JsonRpcRequest): void;
    listen(port?: number): void;
    getClient(websocketId: string): WebSocket;
    broadcast(method: string, params?: any, ignoreId?: string): void;
    notify(websocketId: string, method: string, params?: any): boolean;
    setHandler(method: string, handler: JsonRpcServerHandler): void;
    removeHandler(method: string): void;
}
