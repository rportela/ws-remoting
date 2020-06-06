"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const http = require("http");
const WebSocket = require("ws");
const JsonRpc2_1 = require("../common/JsonRpc2");
/**
 *
 */
var JsonRpcEventType;
(function (JsonRpcEventType) {
    JsonRpcEventType["CLIENT_CONNECT"] = "CLIENT_CONNECT";
    JsonRpcEventType["CLIENT_DISCONNECT"] = "CLIENT_DISCONNECT";
})(JsonRpcEventType = exports.JsonRpcEventType || (exports.JsonRpcEventType = {}));
/**
 *
 */
class JsonRpcServerSocket {
    constructor(server, socket, message) {
        this.onMessage = (data) => {
            const msg = JSON.parse(data.toString());
            if (JsonRpc2_1.isRpcRequest(msg)) {
                this.server.receiveSocketRequest(this, msg);
            }
            else {
                this.server.receiveSocketResponse(this, msg);
            }
        };
        this.onClose = () => {
            this.server.unregisterClient(this);
        };
        this.info = message;
        this.id = message.headers["sec-websocket-key"].toString();
        this.server = server;
        this.socket = socket;
        this.socket.on("close", this.onClose);
        this.socket.on("message", this.onMessage);
    }
    send(data) {
        this.socket.send(data);
    }
    respond(req, err, result) {
        const resp = {
            id: req.id,
            jsonrpc: req.jsonrpc,
            error: err,
            result: result,
        };
        const json = JSON.stringify(resp);
        this.socket.send(json);
    }
    call(method, params) {
        return this.server.rpc.call(this.socket.send, method, params);
    }
    notify(method, params) {
        const req = {
            id: null,
            jsonrpc: "2.0",
            method: method,
            params: params,
        };
        const json = JSON.stringify(req);
        this.socket.send(json);
    }
}
exports.JsonRpcServerSocket = JsonRpcServerSocket;
class JsonRpcServer {
    constructor() {
        this.clients = [];
        this.registerClient = (ws, message) => {
            const client = new JsonRpcServerSocket(this, ws, message);
            this.clients.push(client);
            this.run(JsonRpcEventType.CLIENT_CONNECT, client, client.info);
        };
        this.onHttpRequest = (req, res) => {
            res.write("Hello World!");
            res.end();
        };
        this.rpc = new JsonRpc2_1.JsonRpc();
        this.server = http.createServer(this.onHttpRequest);
        this.socket = new WebSocket.Server({ server: this.server });
        this.socket.on("connection", this.registerClient);
    }
    run(method, client, params) {
        const handler = this.rpc.getHandler(method);
        return handler ? handler(client, params) : undefined;
    }
    unregisterClient(client) {
        const idx = this.clients.indexOf(client);
        if (idx >= 0) {
            this.clients.splice(idx, 1);
            this.run(JsonRpcEventType.CLIENT_DISCONNECT, client, client.info);
        }
    }
    receiveSocketResponse(client, response) {
        this.rpc.resolve(response);
    }
    receiveSocketRequest(client, request) {
        if (request.id)
            this.receiveSocketNotification(client, request);
        else {
            const handler = this.rpc.getHandler(request.method);
            if (handler) {
                try {
                    const result = handler(client, request);
                    if (result && result.then)
                        result.then((r) => client.respond(request, undefined, r));
                    else
                        client.respond(request, undefined, result);
                }
                catch (err) {
                    client.respond(request, err, undefined);
                }
            }
            else {
                client.respond(request, new Error("Method not found " + request.method), undefined);
            }
        }
    }
    receiveSocketNotification(client, request) {
        const handler = this.rpc.getHandler(request.method);
        if (handler)
            handler(client, request.params);
    }
    listen(port = 1337) {
        this.server.listen(port);
    }
    getClient(websocketId) {
        for (const ws of this.socket.clients)
            if (websocketId === ws["id"])
                return ws;
        return null;
    }
    broadcast(method, params, ignoreId) {
        this.clients.forEach((ws) => {
            if (!ignoreId || ws.id !== ignoreId)
                this.rpc.notify(ws.send, method, params);
        });
    }
    notify(websocketId, method, params) {
        const client = this.getClient(websocketId);
        if (!client)
            return false;
        else {
            this.rpc.notify(client.send, method, params);
            return true;
        }
    }
    setHandler(method, handler) {
        this.rpc.setHandler(method, handler);
    }
    removeHandler(method) {
        this.rpc.removeHandler(method);
    }
}
exports.JsonRpcServer = JsonRpcServer;
