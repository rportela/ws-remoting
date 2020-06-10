"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function createId() {
    return new Date().getTime().toString(36) + "_" + Math.random().toString(36);
}
exports.createId = createId;
