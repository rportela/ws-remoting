export declare enum WebSocketEventType {
    CONNECT = "WS_CONNECT",
    DISCONNECT = "WS_DISCONNECT",
    ERROR = "WS_ERROR",
    MESSAGE = "WS_MESSAGE",
    ATTEMPT = "WS_ATTEMPT"
}
export declare class WebSocketClient {
    private address;
    private protocols?;
    private socket;
    private emitter;
    private reconnectHandler;
    private _connecting;
    private _connected;
    constructor(address: string, protocols?: string | string[], reconnectInterval?: number);
    private connect;
    private onOpen;
    private onClose;
    private onError;
    private onAttempt;
    protected onMessage: (event: MessageEvent) => void;
    on(event: string, listener: (params?: any) => void): void;
    off(event: string, listener: (params?: any) => void): void;
    emit(event: string, params?: any): void;
    stopTrying(): void;
    isConnected(): boolean;
    isConnecting(): boolean;
    send(data: string | ArrayBuffer | SharedArrayBuffer | Blob | ArrayBufferView): void;
}
