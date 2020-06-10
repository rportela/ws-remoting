import { SocketData } from "../common/JsonRpc2";
export default class WebSocketRpc {
    private buffer;
    private rpc;
    private socket;
    private notificationDb;
    constructor(address: string, protocols?: string | string[], reconnectInterval?: number);
    private onSocketConnect;
    private flushBuffer;
    private flushNotifications;
    protected onMessage: (event: MessageEvent) => void;
    send(data: SocketData): void;
    setHandler(method: string, handler: (...params: any) => void): void;
    removeHandler(method: string): void;
    runHandler(method: string, ...params: any): Promise<any>;
    call(method: string, params?: any): Promise<any>;
    notify(method: string, params?: any): void;
    on(event: string, listener: (params?: any) => void): void;
    off(event: string, listener: (params?: any) => void): void;
    emit(event: string, params?: any): void;
}
