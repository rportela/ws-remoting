import * as WebSocket from "ws";
export declare enum JsonRpcEventType {
    SERVER_CONNECT = "SERVER_CONNECT",
    SERVER_DISCONNECT = "SERVER_DISCONNECT",
    CLIENT_CONNECT = "CLIENT_CONNECT",
    CLIENT_DISCONNECT = "CLIENT_DISCONNECT"
}
export declare class JsonRpcServer {
    private server;
    private socket;
    private rpc;
    constructor();
    private onConnection;
    private onHttpRequest;
    listen(port?: number): void;
    set(method: string, handler: (params?: any) => any): void;
    remove(method: string): void;
    getClient(websocketId: string): WebSocket;
    call(websocketId: string, method: string, params?: any): Promise<any>;
    broadcast(method: string, params?: any, ignoreId?: string): void;
    notify(websocketId: string, method: string, params?: any): boolean;
}
