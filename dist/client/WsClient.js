"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const Dispatcher_1 = require("../common/Dispatcher");
const WsRemoting_1 = require("../common/WsRemoting");
exports.WsClientAction = {
    CONNECT: "CONNECT",
    DISCONNECT: "DISCONNECT",
    ERROR: "ERROR",
};
/**
 * This class handles WebSocket connections and
 * remote procedure invocations on a remote server.
 *
 * @author Rodrigo Portela
 */
class WsClient {
    /**
     * The standard constructor. This method already tries to connect to the remoting server.
     * @param url
     */
    constructor(url) {
        this.socket = null;
        this.is_connecting = false;
        this.is_connected = false;
        this.buffer = {};
        this.reconnectInterval = 30000;
        this.listeners = new Dispatcher_1.default();
        /**
         * This method handles the connection and flushes any remoting messages present on the buffer.
         */
        this.handleConnect = () => {
            var _a;
            this.is_connected = true;
            this.is_connecting = false;
            for (let key of Object.keys(this.buffer)) {
                const message = this.buffer[key];
                if (!message.sent_at) {
                    message.sent_at = new Date();
                    (_a = this.socket) === null || _a === void 0 ? void 0 : _a.send(JSON.stringify(message));
                }
            }
            this.listeners.dispatch(exports.WsClientAction.CONNECT, this);
        };
        /**
         * This method handles an error.
         * TODO: make sure promises are rejected and something is actually done here.
         */
        this.handleError = (ev) => {
            console.error(ev.target);
            this.listeners.dispatch(exports.WsClientAction.ERROR, this);
        };
        /**
         * Handles a disconnection and try again every 2 seconds to reconnect.
         * TODO: make interval configurable.
         */
        this.handleDisconnect = (ev) => {
            this.is_connected = false;
            this.is_connecting = false;
            console.log("socket disconnected, will try to reconnect", ev.reason);
            this.listeners.dispatch(exports.WsClientAction.DISCONNECT, this);
            this.reconnectHandle = window.setInterval(this.handleReAttempt, this.reconnectInterval);
        };
        /**
         * Handle an attempt to reconnect.
         */
        this.handleReAttempt = () => {
            if (this.is_connected) {
                if (this.reconnectHandle) {
                    window.clearInterval(this.reconnectHandle);
                    this.reconnectHandle = undefined;
                }
            }
            else {
                this.connect();
            }
        };
        /**
         * Handle a message received.
         * This is the core of the remoting api.
         * It will call either the resolve or reject method of a promise stored on a WsMessage.
         */
        this.receiveResponse = (ev) => {
            const response = JSON.parse(ev.data);
            if (WsRemoting_1.WsResponseType.BROADCAST === response.responseType) {
                this.listeners.dispatch(response.action, response.result);
            }
            else {
                if (response.id) {
                    const message = this.buffer[response.id];
                    if (message) {
                        if (WsRemoting_1.WsResponseType.SUCCESS === response.responseType) {
                            message.resolve(response.result);
                        }
                        else {
                            message.reject(new Error(response.error));
                        }
                        delete this.buffer[response.id];
                    }
                }
                else {
                    console.error(response);
                    console.trace();
                }
            }
        };
        this.url = url;
        this.connect();
    }
    /**
     * This method connects this client to a remoting server when no connection is present.
     * If a socket is already present, this method does nothing.
     */
    connect() {
        if (this.is_connecting)
            return;
        if (this.is_connected)
            return;
        this.is_connecting = true;
        this.socket = new WebSocket(this.url);
        this.socket.onopen = this.handleConnect;
        this.socket.onerror = this.handleError;
        this.socket.onmessage = this.receiveResponse;
        this.socket.onclose = this.handleDisconnect;
    }
    /**
     * The public mehtod that exposes a remoting message.
     * This method creates a promise and makes sure the resolve and reject are binded to a WsMessage.
     *
     * @param action
     * @param params
     */
    call(action, params) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                var _a;
                const msg = new WsRemoting_1.WsRequest(action, params, resolve, reject);
                this.buffer[msg.id] = msg;
                if (this.is_connected) {
                    msg.sent_at = new Date();
                    (_a = this.socket) === null || _a === void 0 ? void 0 : _a.send(JSON.stringify(msg));
                }
            });
        });
    }
    /**
     * Ads a new listener to events dispatched by this instance.
     *
     * @param action
     * @param listener
     */
    addListener(action, listener) {
        this.listeners.register(action, listener);
    }
    /**
     * Removes a listener from events dispatched by this instance.
     *
     * @param action
     * @param listener
     */
    removeListener(action, listener) {
        this.listeners.unregister(action, listener);
    }
}
exports.WsClient = WsClient;
