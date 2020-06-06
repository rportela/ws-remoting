"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const JsonRpc2_1 = require("../common/JsonRpc2");
const ObservableDb_1 = require("./ObservableDb");
const WebSocketClient_1 = require("./WebSocketClient");
class ClientRpc {
    constructor(address, protocols) {
        this.buffer = [];
        this.onDisconnect = (params) => {
            this.runHandler(WebSocketClient_1.ClientSocketEventType.DISCONNECT, params);
        };
        this.flushNotification = (notification) => {
            this.rpc.notify(this.socket.send, notification.method, notification.params);
            this.notificationsdb.delete("notification", notification.localId);
        };
        this.onConnect = (params) => {
            this.flushBuffer();
            this.flushNotifications();
            this.runHandler(WebSocketClient_1.ClientSocketEventType.CONNECT, params);
        };
        this.onAttempt = (params) => {
            this.runHandler(WebSocketClient_1.ClientSocketEventType.ATTEMPT, params);
        };
        this.onError = (err) => {
            this.rpc.raiseError(err);
        };
        this.onMessage = (data) => {
            const msg = JSON.parse(data.toString());
            if (JsonRpc2_1.isRpcRequest(msg)) {
                const req = msg;
                if (req.id) {
                    try {
                        const result = this.runHandler(req.method, req.params);
                        if (result && result.then)
                            result
                                .then((result) => this.reply(req, undefined, result))
                                .catch((err) => this.reply(req, err, undefined));
                        else
                            this.reply(req, undefined, result);
                    }
                    catch (e) {
                        this.reply(req, e, undefined);
                    }
                }
                else {
                    try {
                        this.runHandler(req.method, req.params);
                    }
                    catch (e) {
                        this.rpc.raiseError(e);
                    }
                }
            }
            else {
                this.rpc.resolve(msg);
            }
        };
        this.rpc = new JsonRpc2_1.JsonRpc();
        this.notificationsdb = new ObservableDb_1.default({
            name: "json_rpc",
            version: 1,
            collections: [
                {
                    name: "notification",
                    keyPath: "localId",
                    autoIncrement: true,
                },
            ],
        });
        this.socket = new WebSocketClient_1.ClientSocket(address, protocols);
        this.socket.on(WebSocketClient_1.ClientSocketEventType.MESSAGE, this.onMessage);
        this.socket.on(WebSocketClient_1.ClientSocketEventType.ERROR, this.onError);
        this.socket.on(WebSocketClient_1.ClientSocketEventType.ATTEMPT, this.onAttempt);
        this.socket.on(WebSocketClient_1.ClientSocketEventType.CONNECT, this.onConnect);
        this.socket.on(WebSocketClient_1.ClientSocketEventType.DISCONNECT, this.onDisconnect);
    }
    runHandler(method, params) {
        const handler = this.rpc.getHandler(method);
        return handler ? handler(params) : undefined;
    }
    flushBuffer() {
        const pending = this.buffer;
        this.buffer = [];
        pending.forEach(this.socket.send);
    }
    flushNotifications() {
        this.notificationsdb
            .all("notification")
            .then((arr) => arr.forEach(this.flushNotification))
            .catch(this.onError);
    }
    reply(req, error, result) {
        const resp = {
            id: req.id,
            jsonrpc: req.jsonrpc,
            error: error,
            result: result,
        };
        this.sendMessage(resp);
    }
    sendMessage(message) {
        const json = JSON.stringify(message);
        if (this.socket.isConnected())
            this.socket.send(json);
        else
            this.buffer.push(json);
    }
    call(method, params) {
        return this.rpc.call(this.socket.isConnected()
            ? this.socket.send
            : (json) => this.buffer.push(json), method, params);
    }
    notify(method, params) {
        if (this.socket.isConnected())
            this.rpc.notify(this.socket.send, method, params);
        else {
            this.notificationsdb.add("notification", {
                method: method,
                params: params,
                createdAt: new Date(),
            });
        }
    }
    setHandler(method, handler) {
        this.rpc.setHandler(method, handler);
    }
    removeHandler(method) {
        this.rpc.removeHandler(method);
    }
}
exports.default = ClientRpc;
