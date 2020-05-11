import * as WebSocket from "ws";
import Dispatcher from "../common/Dispatcher";
export interface WsServerAction {
    (sender: string, params: any): any;
}
/**
 * This class implements a remoting server.
 * Use this to realtime expose functionality to any app you choose.
 */
export declare class WsServer {
    private server;
    actions: Dispatcher;
    /**
     * This method parses a received messagae as JSON and takes the appropriate action.
     * If it fails, a message is sent back to the client with no id but a failMessage.
     *
     * @param ws
     * @param message
     */
    private receiveRequest;
    /**
     * This method handles a connection and binds listeners.
     * The message event will raise a handle message call.
     * This close even will delete the listener from the list of clients.
     */
    private handleConnection;
    /**
     * This method broadcasts a message to all sockets connected.
     * Optionally you can ignore the specific client id that sent the original message.
     *
     * @param action
     * @param params
     * @param ignore
     */
    broadcast(action: string, result: any, ignore?: string | undefined): void;
    /**
     * This method registers an action that can be called over a websocket.
     *
     * @param action
     * @param fn
     */
    register(action: string, fn: WsServerAction): void;
    /**
     * This method deletes an action that can be called of a websocket.
     *
     * @param action
     */
    unregister(action: string): void;
    /**
     * This constructor initializes the class and creates a new WebSocket server.
     * @param params
     */
    constructor(options: WebSocket.ServerOptions);
}
