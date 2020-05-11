"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const WebSocket = require("ws");
const Dispatcher_1 = require("../common/Dispatcher");
const WsResponse_1 = require("../common/WsResponse");
/**
 * This class implements a remoting server.
 * Use this to realtime expose functionality to any app you choose.
 */
class WsServer {
    /**
     * This constructor initializes the class and creates a new WebSocket server.
     * @param params
     */
    constructor(options) {
        this.actions = new Dispatcher_1.default();
        /**
         * This method handles a connection and binds listeners.
         * The message event will raise a handle message call.
         * This close even will delete the listener from the list of clients.
         */
        this.handleConnection = (ws, req) => {
            ws.id = req.headers["sec-websocket-key"];
            console.log("connected client", ws.id);
            ws.on("message", (message) => {
                this.receiveRequest(ws, message);
            });
            ws.on("close", () => {
                console.log("disconnected client", ws.id);
            });
        };
        this.server = new WebSocket.Server(options);
        this.server.on("connection", this.handleConnection);
    }
    /**
     * This method parses a received messagae as JSON and takes the appropriate action.
     * If it fails, a message is sent back to the client with no id but a failMessage.
     *
     * @param ws
     * @param message
     */
    receiveRequest(ws, message) {
        //console.log(ws.id, message);
        const response = new WsResponse_1.WsResponse();
        try {
            const request = JSON.parse(message);
            if (!request.id) {
                response.responseType = WsResponse_1.WsResponseType.ERROR;
                response.error =
                    "You need to provide a message id to track the result.";
            }
            else {
                response.id = request.id;
                if (!request.action) {
                    response.responseType = WsResponse_1.WsResponseType.ERROR;
                    response.error = "Your message needs to have an 'action' attribute.";
                }
                else {
                    const action = this.actions[request.action];
                    if (!action) {
                        response.responseType = WsResponse_1.WsResponseType.ERROR;
                        response.error = "Action not found: " + request.action;
                    }
                    else {
                        response.result = action(ws.id, request.params);
                        response.responseType = WsResponse_1.WsResponseType.SUCCESS;
                    }
                }
            }
        }
        catch (error) {
            response.error = error.toString();
            response.responseType = WsResponse_1.WsResponseType.ERROR;
        }
        ws.send(JSON.stringify(response));
    }
    /**
     * This method broadcasts a message to all sockets connected.
     * Optionally you can ignore the specific client id that sent the original message.
     *
     * @param action
     * @param params
     * @param ignore
     */
    broadcast(action, result, ignore = undefined) {
        const broadmsg = JSON.stringify({
            responseType: WsResponse_1.WsResponseType.BROADCAST,
            action: action,
            result: result,
        });
        this.server.clients.forEach((client) => {
            if (!ignore || ignore !== client.id) {
                client.send(broadmsg);
            }
        });
    }
    /**
     * This method registers an action that can be called over a websocket.
     *
     * @param action
     * @param fn
     */
    register(action, fn) {
        this.actions[action] = fn;
    }
    /**
     * This method deletes an action that can be called of a websocket.
     *
     * @param action
     */
    unregister(action) {
        delete this.actions[action];
    }
}
exports.WsServer = WsServer;
