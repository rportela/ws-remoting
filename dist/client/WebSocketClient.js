"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const EventEmitter_1 = require("../common/EventEmitter");
const DEFAULT_RECONNECT_INTERVAL = 30000;
var WebSocketEventType;
(function (WebSocketEventType) {
    WebSocketEventType["CONNECT"] = "WS_CONNECT";
    WebSocketEventType["DISCONNECT"] = "WS_DISCONNECT";
    WebSocketEventType["ERROR"] = "WS_ERROR";
    WebSocketEventType["MESSAGE"] = "WS_MESSAGE";
    WebSocketEventType["ATTEMPT"] = "WS_ATTEMPT";
})(WebSocketEventType = exports.WebSocketEventType || (exports.WebSocketEventType = {}));
class WebSocketClient {
    constructor(address, protocols, reconnectInterval) {
        this.onOpen = (event) => {
            this._connected = true;
            this._connecting = false;
            this.emitter.emit(WebSocketEventType.CONNECT, event);
        };
        this.onClose = (event) => {
            this._connected = false;
            this._connecting = false;
            this.emitter.emit(WebSocketEventType.DISCONNECT, event);
        };
        this.onError = (event) => {
            this.emitter.emit(WebSocketEventType.ERROR, event);
        };
        this.onAttempt = () => {
            this.emitter.emit(WebSocketEventType.ATTEMPT);
            this.connect();
        };
        this.onMessage = (event) => {
            this.emitter.emit(WebSocketEventType.MESSAGE, event);
        };
        this.emitter = new EventEmitter_1.default();
        this.address = address;
        this.protocols = protocols;
        this._connected = false;
        this._connecting = false;
        this.reconnectHandler = window.setInterval(this.onAttempt, reconnectInterval || DEFAULT_RECONNECT_INTERVAL);
        this.connect();
    }
    connect() {
        if (this._connected || this._connecting)
            return;
        this._connecting = true;
        this.socket = new WebSocket(this.address, this.protocols);
        this.socket.onopen = this.onOpen;
        this.socket.onclose = this.onClose;
        this.socket.onerror = this.onError;
        this.socket.onmessage = this.onMessage;
    }
    on(event, listener) {
        this.emitter.on(event, listener);
    }
    off(event, listener) {
        this.emitter.off(event, listener);
    }
    emit(event, params) {
        this.emitter.emit(event, params);
    }
    stopTrying() {
        window.clearInterval(this.reconnectHandler);
        this.reconnectHandler = 0;
    }
    isConnected() {
        return this._connected;
    }
    isConnecting() {
        return this._connecting;
    }
    send(data) {
        this.socket.send(data);
    }
}
exports.WebSocketClient = WebSocketClient;
