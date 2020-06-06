"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const http = require("http");
const WebSocket = require("ws");
const JsonRpc2_1 = require("../common/JsonRpc2");
var JsonRpcEventType;
(function (JsonRpcEventType) {
    JsonRpcEventType["SERVER_CONNECT"] = "SERVER_CONNECT";
    JsonRpcEventType["SERVER_DISCONNECT"] = "SERVER_DISCONNECT";
    JsonRpcEventType["CLIENT_CONNECT"] = "CLIENT_CONNECT";
    JsonRpcEventType["CLIENT_DISCONNECT"] = "CLIENT_DISCONNECT";
})(JsonRpcEventType = exports.JsonRpcEventType || (exports.JsonRpcEventType = {}));
class JsonRpcServer {
    constructor() {
        this.onConnection = (ws, message) => {
            ws["info"] = message;
            ws["id"] = message.headers["sec-websocket-key"];
            ws.on("message", (message) => {
                this.rpc.receive(JSON.parse(message.toString()), (data) => ws.send(data));
            });
            ws.on("close", () => {
                this.rpc.run(JsonRpcEventType.CLIENT_DISCONNECT, ws);
            });
            this.rpc.run(JsonRpcEventType.CLIENT_CONNECT, ws);
        };
        this.onHttpRequest = (req, res) => {
            res.write("Hello World!");
            res.end();
        };
        this.server = http.createServer(this.onHttpRequest);
        this.socket = new WebSocket.Server({ server: this.server });
        this.socket.on("connection", this.onConnection);
        this.rpc = new JsonRpc2_1.JsonRpc();
    }
    listen(port = 1337) {
        this.server.listen(port);
    }
    set(method, handler) {
        this.rpc.set(method, handler);
    }
    remove(method) {
        this.rpc.remove(method);
    }
    getClient(websocketId) {
        for (const ws of this.socket.clients)
            if (websocketId === ws["id"])
                return ws;
        return null;
    }
    call(websocketId, method, params) {
        const client = this.getClient(websocketId);
        if (!client)
            return Promise.reject(new Error("Can't find client with id " + websocketId));
        else
            return this.rpc.call(client.send, method, params);
    }
    broadcast(method, params, ignoreId) {
        this.socket.clients.forEach((ws) => {
            if (!ignoreId || ws["id"] !== ignoreId)
                this.rpc.notify(ws.send, method, params);
        });
    }
    notify(websocketId, method, params) {
        const client = this.getClient(websocketId);
        if (!client)
            return false;
        this.rpc.notify(client.send, method, params);
        return true;
    }
}
exports.JsonRpcServer = JsonRpcServer;
