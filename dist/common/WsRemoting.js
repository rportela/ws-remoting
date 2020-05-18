"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class WsRequest {
    constructor(action, params, resolve, reject) {
        this.id = new Date().getTime();
        this.action = action;
        this.params = params;
        this.resolve = resolve;
        this.reject = reject;
    }
}
exports.WsRequest = WsRequest;
var WsResponseType;
(function (WsResponseType) {
    WsResponseType["SUCCESS"] = "SUCCESS";
    WsResponseType["ERROR"] = "ERROR";
    WsResponseType["BROADCAST"] = "BROADCAST";
})(WsResponseType = exports.WsResponseType || (exports.WsResponseType = {}));
class WsResponse {
}
exports.WsResponse = WsResponse;
