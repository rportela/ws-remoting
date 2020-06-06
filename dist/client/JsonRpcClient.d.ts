import { JsonRpcRequest, JsonRpcResponse } from "../common/JsonRpc2";
declare type ClientHandler = (params?: any) => void;
export default class ClientRpc {
    private notificationsdb;
    private socket;
    private rpc;
    private buffer;
    constructor(address: string, protocols?: string | string[]);
    private runHandler;
    private onDisconnect;
    private flushBuffer;
    private flushNotification;
    private flushNotifications;
    private onConnect;
    private onAttempt;
    private onError;
    private onMessage;
    private reply;
    protected sendMessage(message: JsonRpcRequest | JsonRpcResponse): void;
    call(method: string, params?: any): Promise<any>;
    notify(method: string, params?: any): void;
    setHandler(method: string, handler: ClientHandler): void;
    removeHandler(method: string): void;
}
export {};
