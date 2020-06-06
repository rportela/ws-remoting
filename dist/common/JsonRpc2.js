"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Tests a message to tell if it's a request or alternatively a response.
 *
 * @param message
 */
function isRpcRequest(message) {
    return message && message.method !== undefined;
}
exports.isRpcRequest = isRpcRequest;
/**
 * Implements the Json RPC request and the resolve and reject functions
 * that attach this to a promise.
 *
 */
class JsonRpcPendingRequest {
    /**
     *  Constructs a new object by assigning all attributes on a single call.
     *
     * @param resolve
     * @param reject
     * @param id
     * @param method
     * @param params
     */
    constructor(resolve, reject, id, method, params) {
        this.resolve = resolve;
        this.reject = reject;
        this.method = method;
        this.id = id;
        this.params = params;
        this.jsonrpc = "2.0";
    }
}
exports.JsonRpcPendingRequest = JsonRpcPendingRequest;
/**
 * Creates a new RPC request id;
 */
function createRpcId() {
    return new Date().getTime().toString(36) + "_" + Math.random().toString(36);
}
exports.createRpcId = createRpcId;
/**
 *
 */
class JsonRpc {
    constructor() {
        this.handlers = {};
        this.pending = {};
        /**
         * Tries to find a generic handler to errors.
         * If none is found, console.error is used to display an error.
         */
        this.raiseError = (err) => {
            let errHandler = this.handlers["error"];
            if (!errHandler)
                errHandler = this.handlers["Error"];
            if (!errHandler)
                errHandler = this.handlers["ERROR"];
            if (!errHandler)
                errHandler = console.error;
            errHandler(err);
        };
    }
    setHandler(method, handler) {
        this.handlers[method] = handler;
    }
    removeHandler(method) {
        delete this.handlers[method];
    }
    getHandler(method) {
        return this.handlers[method];
    }
    call(pipe, method, params) {
        return new Promise((resolve, reject) => {
            const pending = new JsonRpcPendingRequest(resolve, reject, createRpcId(), method, params);
            this.pending[pending.id] = pending;
            const json = JSON.stringify(pending);
            pipe(json);
        });
    }
    resolve(response) {
        const req = this.pending[response.id];
        if (req) {
            delete this.pending[response.id];
            if (response.error)
                req.reject(response.error);
            else
                req.resolve(response.result);
        }
        else {
            this.raiseError(new Error("Got a response with no matching request id"));
        }
    }
    notify(pipe, method, params) {
        const req = {
            id: null,
            jsonrpc: "2.0",
            method: method,
            params: params,
        };
        const json = JSON.stringify(req);
        pipe(json);
    }
}
exports.JsonRpc = JsonRpc;
