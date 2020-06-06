export declare enum ClientSocketEventType {
    CONNECT = "CONNECT",
    DISCONNECT = "DISCONNECT",
    ATTEMPT = "ATTEMPT",
    ERROR = "ERROR",
    MESSAGE = "MESSAGE"
}
export declare class ClientSocket {
    reconnectInterval: number;
    url: string;
    protocols?: string | string[];
    private _socket;
    private _reconnectHandle;
    private _isConnected;
    private _isConnecting;
    private _emitter;
    private onOpen;
    private onMessage;
    private onClose;
    private onError;
    private reconnect;
    constructor(url: string, protocols?: string | string[], reconnectInterval?: number);
    receive: (message: string) => void;
    connect(): void;
    on(event: ClientSocketEventType, listener: (params?: any) => void): void;
    off(event: ClientSocketEventType, listener: (params?: any) => void): void;
    send(data: string | ArrayBuffer | SharedArrayBuffer | Blob | ArrayBufferView): void;
    isConnected(): boolean;
}
