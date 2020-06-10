"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var DbEventType;
(function (DbEventType) {
    DbEventType["ADD"] = "DB_ADD";
    DbEventType["PUT"] = "DB_PUT";
    DbEventType["DELETE"] = "DB_DELETE";
    DbEventType["UPGRADED"] = "DB_UPGRADE";
    DbEventType["OPEN"] = "DB_OPEN";
    DbEventType["CLOSED"] = "DB_CLOSED";
    DbEventType["CLEAR"] = "DB_CLEAR";
    DbEventType["ERROR"] = "ERROR";
})(DbEventType = exports.DbEventType || (exports.DbEventType = {}));
function isDbRecordSaveEvent(event) {
    return event && event.record !== undefined;
}
exports.isDbRecordSaveEvent = isDbRecordSaveEvent;
function isDbRecordDeleteEvent(event) {
    return event && event.key !== undefined;
}
exports.isDbRecordDeleteEvent = isDbRecordDeleteEvent;
