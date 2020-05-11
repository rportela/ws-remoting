export declare const WsClientAction: {
    CONNECT: string;
    DISCONNECT: string;
    ERROR: string;
};
/**
 * This class handles WebSocket connections and
 * remote procedure invocations on a remote server.
 *
 * @author Rodrigo Portela
 */
export declare class WsClient {
    private url;
    private socket;
    private is_connecting;
    private is_connected;
    private buffer;
    reconnectInterval: number;
    private reconnectHandle;
    private listeners;
    /**
     * The standard constructor. This method already tries to connect to the remoting server.
     * @param url
     */
    constructor(url: string);
    /**
     * This method connects this client to a remoting server when no connection is present.
     * If a socket is already present, this method does nothing.
     */
    connect(): void;
    /**
     * This method handles the connection and flushes any remoting messages present on the buffer.
     */
    private handleConnect;
    /**
     * This method handles an error.
     * TODO: make sure promises are rejected and something is actually done here.
     */
    private handleError;
    /**
     * Handles a disconnection and try again every 2 seconds to reconnect.
     * TODO: make interval configurable.
     */
    private handleDisconnect;
    /**
     * Handle an attempt to reconnect.
     */
    private handleReAttempt;
    /**
     * Handle a message received.
     * This is the core of the remoting api.
     * It will call either the resolve or reject method of a promise stored on a WsMessage.
     */
    private receiveResponse;
    /**
     * The public mehtod that exposes a remoting message.
     * This method creates a promise and makes sure the resolve and reject are binded to a WsMessage.
     *
     * @param action
     * @param params
     */
    call(action: string, params: any): Promise<any>;
    /**
     * Ads a new listener to events dispatched by this instance.
     *
     * @param action
     * @param listener
     */
    addListener(action: string, listener: (params: any) => void): void;
    /**
     * Removes a listener from events dispatched by this instance.
     *
     * @param action
     * @param listener
     */
    removeListener(action: string, listener: (params: any) => void): void;
}
