import EventEmitter from "../common/EventEmitter";

const DEFAULT_RECONNECT_INTERVAL = 30000;

export enum WebSocketEventType {
  CONNECT = "WS_CONNECT",
  DISCONNECT = "WS_DISCONNECT",
  ERROR = "WS_ERROR",
  MESSAGE = "WS_MESSAGE",
  ATTEMPT = "WS_ATTEMPT",
}

export class WebSocketClient {
  private address: string;
  private protocols?: string | string[];
  private socket: WebSocket;
  private emitter: EventEmitter;
  private reconnectHandler;
  private _connecting: boolean;
  private _connected: boolean;

  constructor(
    address: string,
    protocols?: string | string[],
    reconnectInterval?: number
  ) {
    this.emitter = new EventEmitter();
    this.address = address;
    this.protocols = protocols;
    this._connected = false;
    this._connecting = true;
    this.reconnectHandler = window.setInterval(
      this.onAttempt,
      reconnectInterval || DEFAULT_RECONNECT_INTERVAL
    );
    this.connect();
  }

  private connect() {
    if (this._connected || this._connecting) return;
    this.socket = new WebSocket(this.address, this.protocols);
    this.socket.onopen = this.onOpen;
    this.socket.onclose = this.onClose;
    this.socket.onerror = this.onError;
    this.socket.onmessage = this.onMessage;
  }

  private onOpen = () => {
    this._connected = true;
    this._connecting = false;
    this.emitter.emit(WebSocketEventType.CONNECT, event);
  };

  private onClose = (event: CloseEvent) => {
    this._connected = false;
    this._connecting = false;
    this.emitter.emit(WebSocketEventType.DISCONNECT, event);
  };

  private onError = (event: Event) => {
    this.emitter.emit(WebSocketEventType.ERROR, event);
  };

  private onAttempt = () => {
    this._connecting = true;
    this.emitter.emit(WebSocketEventType.ATTEMPT);
    this.connect();
  };

  protected onMessage = (event: MessageEvent) => {
    this.emitter.emit(WebSocketEventType.MESSAGE, event);
  };

  on(event: string, listener: (params?: any) => void) {
    this.emitter.on(event, listener);
  }
  off(event: string, listener: (params?: any) => void) {
    this.emitter.off(event, listener);
  }

  emit(event: string, params?: any) {
    this.emitter.emit(event, params);
  }

  stopTrying() {
    window.clearInterval(this.reconnectHandler);
    this.reconnectHandler = 0;
  }

  isConnected(): boolean {
    return this._connected;
  }

  isConnecting(): boolean {
    return this._connecting;
  }

  send(
    data: string | ArrayBuffer | SharedArrayBuffer | Blob | ArrayBufferView
  ) {
    this.socket.send(data);
  }
}
