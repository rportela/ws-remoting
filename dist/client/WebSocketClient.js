"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const EventEmitter_1 = require("../common/EventEmitter");
var ClientSocketEventType;
(function (ClientSocketEventType) {
    ClientSocketEventType["CONNECT"] = "CONNECT";
    ClientSocketEventType["DISCONNECT"] = "DISCONNECT";
    ClientSocketEventType["ATTEMPT"] = "ATTEMPT";
    ClientSocketEventType["ERROR"] = "ERROR";
    ClientSocketEventType["MESSAGE"] = "MESSAGE";
})(ClientSocketEventType = exports.ClientSocketEventType || (exports.ClientSocketEventType = {}));
class ClientSocket {
    constructor(url, protocols, reconnectInterval) {
        this.onOpen = (event) => {
            this._isConnected = true;
            this._isConnecting = false;
            if (this._reconnectHandle) {
                window.clearInterval(this._reconnectHandle);
                this._reconnectHandle = undefined;
            }
            this._emitter.emit(ClientSocketEventType.CONNECT, event);
        };
        this.onMessage = (event) => {
            this._emitter.emit(ClientSocketEventType.MESSAGE, event.data);
        };
        this.onClose = (event) => {
            this._isConnected = false;
            this._isConnecting = false;
            if (!this._reconnectHandle && this.reconnectInterval > 1000)
                this._reconnectHandle = window.setInterval(this.reconnect, this.reconnectInterval);
            this._emitter.emit(ClientSocketEventType.DISCONNECT, event);
        };
        this.onError = (event) => {
            this._emitter.emit(ClientSocketEventType.ERROR, event);
            event.stopPropagation();
        };
        this.reconnect = () => {
            if (this.isConnected) {
                if (this._reconnectHandle) {
                    window.clearInterval(this._reconnectHandle);
                    this._reconnectHandle = undefined;
                }
            }
            else if (!this._isConnecting) {
                this._emitter.emit(ClientSocketEventType.ATTEMPT, this);
                this.connect();
            }
        };
        this.url = url;
        this.protocols = protocols;
        this.reconnectInterval = reconnectInterval ? reconnectInterval : 30000;
        this._isConnected = false;
        this._isConnecting = false;
        this._emitter = new EventEmitter_1.default();
    }
    connect() {
        if (this._isConnected || this._isConnecting)
            return;
        this._isConnecting = true;
        this._socket = new WebSocket(this.url, this.protocols);
        this._socket.onopen = this.onOpen;
        this._socket.onmessage = this.onMessage;
        this._socket.onclose = this.onClose;
        this._socket.onerror = this.onError;
        if (!this._reconnectHandle)
            this._reconnectHandle = window.setInterval(this.reconnect, this.reconnectInterval);
    }
    on(event, listener) {
        this._emitter.on(event, listener);
    }
    off(event, listener) {
        this._emitter.off(event, listener);
    }
    send(data) {
        this._socket.send(data);
    }
    isConnected() {
        return this._isConnected;
    }
}
exports.ClientSocket = ClientSocket;
