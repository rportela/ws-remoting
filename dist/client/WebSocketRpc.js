"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const JsonRpc2_1 = require("../common/JsonRpc2");
const BrowserDb_1 = require("./BrowserDb");
const WebSocketClient_1 = require("./WebSocketClient");
class WebSocketRpc {
    constructor(address, protocols, reconnectInterval) {
        this.buffer = [];
        this.rpc = new JsonRpc2_1.JsonRpc();
        this.notificationDb = new BrowserDb_1.default({
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
        this.onSocketConnect = () => {
            this.flushBuffer();
            this.flushNotifications();
        };
        this.onMessage = (event) => {
            const data = event.data;
            const msg = JSON.parse(data);
            if (JsonRpc2_1.isRpcRequest(msg)) {
                const req = msg;
                if (req.id)
                    this.rpc
                        .run(req.method, req.params)
                        .then((result) => {
                        const resp = {
                            id: req.id,
                            jsonrpc: req.jsonrpc,
                            result: result,
                        };
                        if (this.socket.isConnected())
                            this.socket.send(JSON.stringify(resp));
                        else
                            this.notificationDb.add("notification", resp);
                    })
                        .catch((err) => {
                        const resp = {
                            id: req.id,
                            jsonrpc: req.jsonrpc,
                            error: {
                                code: -1,
                                message: err.message,
                                data: err.stack,
                            },
                        };
                        if (this.socket.isConnected())
                            this.socket.send(JSON.stringify(resp));
                        else
                            this.notificationDb.add("notification", resp);
                    });
                else
                    this.socket.emit(req.method, req.params);
            }
            else {
                this.rpc.resolve(msg);
            }
        };
        this.send = (data) => {
            if (this.socket.isConnected())
                this.socket.send(data);
            else
                this.buffer.push(data);
        };
        this.socket = new WebSocketClient_1.WebSocketClient(address, protocols, reconnectInterval);
        this.socket.on(WebSocketClient_1.WebSocketEventType.CONNECT, this.onSocketConnect);
        this.socket.on(WebSocketClient_1.WebSocketEventType.MESSAGE, this.onMessage);
    }
    flushBuffer() {
        const pending = this.buffer;
        this.buffer = [];
        pending.forEach(this.send);
    }
    flushNotifications() {
        this.notificationDb.forEach("notification", (cursor) => {
            const notification = cursor.value;
            this.socket.send(JSON.stringify(notification));
            cursor.delete();
            cursor.continue();
        });
    }
    setHandler(method, handler) {
        this.rpc.setHandler(method, handler);
    }
    removeHandler(method) {
        this.rpc.removeHandler(method);
    }
    runHandler(method, ...params) {
        return this.rpc.run(method, params);
    }
    call(method, params) {
        return this.rpc.call(this.send, method, params);
    }
    notify(method, params) {
        const msg = {
            id: null,
            jsonrpc: "2.0",
            method: method,
            params: params,
        };
        if (this.socket.isConnected())
            this.socket.send(JSON.stringify(msg));
        else
            this.notificationDb.add("notification", msg);
    }
    on(event, listener) {
        this.socket.on(event, listener);
    }
    off(event, listener) {
        this.socket.off(event, listener);
    }
    emit(event, params) {
        this.socket.emit(event, params);
    }
}
exports.default = WebSocketRpc;
