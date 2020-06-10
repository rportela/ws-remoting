"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Handlers {
    constructor() {
        this.handlers = {};
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
    run(method, ...params) {
        return new Promise((resolve, reject) => {
            const handler = this.handlers[method];
            if (!handler)
                reject(new Error("No such method " + method));
            else {
                try {
                    const result = handler(params);
                    if (result && result.then)
                        result.then((r) => resolve(r));
                    else
                        resolve(result);
                }
                catch (e) {
                    reject(e);
                }
            }
        });
    }
}
exports.default = Handlers;
