"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class MethodHandlers {
    constructor() {
        this.methods = {};
    }
    set(method, handler) {
        this.methods[method] = handler;
    }
    unset(method) {
        delete this.methods[method];
    }
}
exports.MethodHandlers = MethodHandlers;
