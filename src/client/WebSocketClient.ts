import EventEmitter from "../common/EventEmitter";

export enum ClientSocketEventType {
  CONNECT = "CONNECT",
  DISCONNECT = "DISCONNECT",
  ATTEMPT = "ATTEMPT",
  ERROR = "ERROR",
  MESSAGE = "MESSAGE",
}

export class ClientSocket {
  reconnectInterval: number;
  url: string;
  protocols?: string | string[];
  private _socket: WebSocket;
  private _reconnectHandle: number;
  private _isConnected: boolean;
  private _isConnecting: boolean;
  private _emitter: EventEmitter;

  private onOpen = (event: Event) => {
    this._isConnected = true;
    this._isConnecting = false;
    if (this._reconnectHandle) {
      window.clearInterval(this._reconnectHandle);
      this._reconnectHandle = undefined;
    }
    this._emitter.emit(ClientSocketEventType.CONNECT, event);
  };

  private onMessage = (event: MessageEvent) => {
    this._emitter.emit(ClientSocketEventType.MESSAGE, event.data);
  };

  private onClose = (event: CloseEvent) => {
    this._isConnected = false;
    this._isConnecting = false;
    if (!this._reconnectHandle && this.reconnectInterval > 1000)
      this._reconnectHandle = window.setInterval(
        this.reconnect,
        this.reconnectInterval
      );
    this._emitter.emit(ClientSocketEventType.DISCONNECT, event);
  };

  private onError = (event: Event) => {
    this._emitter.emit(ClientSocketEventType.ERROR, event);
    event.stopPropagation();
  };

  private reconnect = () => {
    if (this.isConnected) {
      if (this._reconnectHandle) {
        window.clearInterval(this._reconnectHandle);
        this._reconnectHandle = undefined;
      }
    } else if (!this._isConnecting) {
      this._emitter.emit(ClientSocketEventType.ATTEMPT, this);
      this.connect();
    }
  };

  constructor(
    url: string,
    protocols?: string | string[],
    reconnectInterval?: number
  ) {
    this.url = url;
    this.protocols = protocols;
    this.reconnectInterval = reconnectInterval ? reconnectInterval : 30000;
    this._isConnected = false;
    this._isConnecting = false;
    this._emitter = new EventEmitter();
  }

  receive: (message: string) => void;

  connect() {
    if (this._isConnected || this._isConnecting) return;
    this._isConnecting = true;
    this._socket = new WebSocket(this.url, this.protocols);
    this._socket.onopen = this.onOpen;
    this._socket.onmessage = this.onMessage;
    this._socket.onclose = this.onClose;
    this._socket.onerror = this.onError;
    if (!this._reconnectHandle)
      this._reconnectHandle = window.setInterval(
        this.reconnect,
        this.reconnectInterval
      );
  }

  on(event: ClientSocketEventType, listener: (params?: any) => void) {
    this._emitter.on(event, listener);
  }

  off(event: ClientSocketEventType, listener: (params?: any) => void) {
    this._emitter.off(event, listener);
  }

  send(
    data: string | ArrayBuffer | SharedArrayBuffer | Blob | ArrayBufferView
  ) {
    this._socket.send(data);
  }

  isConnected() {
    return this._isConnected;
  }
}
