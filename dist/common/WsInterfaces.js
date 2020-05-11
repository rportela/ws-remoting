"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WsClientActions = {
    CONNECT: "CONNECT",
    DISCONNECT: "DISCONNECT",
    ERROR: "ERROR",
};
exports.WsResponseType = {
    SUCCESS: "SUCCESS",
    BROADCAST: "BROADCAST",
    ERROR: "ERROR",
};
/**
 * This class represents a request. A message waiting to be answered from a remote server.
 *
 * @author Rodrigo Portela
 */
class WsRequest {
    /**
     * Initializes this class with constructor parameters.
     * @param action
     * @param params
     * @param resolve
     * @param reject
     */
    constructor(action, params, resolve, reject) {
        this.sent_at = null;
        this.id = new Date().getTime();
        this.action = action;
        this.params = params;
        this.resolve = resolve;
        this.reject = reject;
    }
}
exports.WsRequest = WsRequest;
class WsResponse {
}
exports.default = WsResponse;
