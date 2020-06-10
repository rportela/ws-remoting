"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const RemoteDb_1 = require("../common/RemoteDb");
const ObservableDb_1 = require("./ObservableDb");
const WebSocketRpc_1 = require("./WebSocketRpc");
const WebSocketClient_1 = require("./WebSocketClient");
const DbEvents_1 = require("../common/DbEvents");
const WS_DB_SCHEMA = "WS_DB_SCHEMA";
class WsDbClient extends WebSocketRpc_1.default {
    constructor(addess, protocols) {
        super(addess, protocols);
        this.onRecordAdd = (event) => {
            console.log("local record add", event);
            this.notify(DbEvents_1.DbEventType.ADD, event);
        };
        this.onRecordPut = (event) => {
            console.log("local record put", event);
            this.notify(DbEvents_1.DbEventType.PUT, event);
        };
        this.onRecordDelete = (event) => {
            console.log("local record delete", event);
            this.notify(DbEvents_1.DbEventType.DELETE, event);
        };
        this.onRemoteRecordAdd = (event) => {
            console.log("remote record add", event);
            this.getDb(event.db).then((db) => db.add(event.collection, event.record));
        };
        this.onRemoteRecordPut = (event) => {
            console.log("remote record put", event);
            this.getDb(event.db).then((db) => db.put(event.collection, event.record));
        };
        this.onRemoteRecordDelete = (event) => {
            console.log("remote record delete", event);
            this.getDb(event.db).then((db) => db.delete(event.collection, event.key));
        };
        this.onRemoteConnect = () => {
            console.log("Connection detected");
            this.call(RemoteDb_1.RemoteDbEventType.SCHEMA).then(this.onRemoteSchema);
        };
        this.onRemoteSchema = (schema, ignoreSync) => {
            localStorage.setItem(WS_DB_SCHEMA, JSON.stringify(schema));
            console.log("got schema", schema, "ignore sync?", ignoreSync);
            const dbs = schema.map(this.createLocalDb);
            if (!ignoreSync) {
                dbs.forEach(this.callSync);
            }
            return dbs;
        };
        this.createLocalDb = (schema) => {
            const db = new ObservableDb_1.default(schema);
            db.on(DbEvents_1.DbEventType.ADD, this.onRecordAdd);
            db.on(DbEvents_1.DbEventType.PUT, this.onRecordPut);
            db.on(DbEvents_1.DbEventType.DELETE, this.onRecordDelete);
            return db;
        };
        this.callSync = (db) => {
            console.log("calling sync on all dbs");
            for (const col of db.getSchema().collections) {
                console.log("calling sync on ", db.getSchema().name, col);
                db.getAll(col.name).then((all) => {
                    const lastUpdatedAt = all && all.length > 0
                        ? all.sort((a, b) => b["updated_at"] - a["updated_at"]).pop()
                            .updated_at
                        : undefined;
                    const event = {
                        collection: col.name,
                        db: db.getSchema().name,
                        lastUpdatedAt: lastUpdatedAt,
                    };
                    this.notify(RemoteDb_1.RemoteDbEventType.SYNC, event);
                });
            }
        };
        this.on(DbEvents_1.DbEventType.ADD, this.onRemoteRecordAdd);
        this.on(DbEvents_1.DbEventType.PUT, this.onRemoteRecordPut);
        this.on(DbEvents_1.DbEventType.DELETE, this.onRemoteRecordDelete);
        this.on(WebSocketClient_1.WebSocketEventType.CONNECT, this.onRemoteConnect);
        const localSchemaText = localStorage.getItem(WS_DB_SCHEMA);
        if (localSchemaText) {
            this.schemas = JSON.parse(localSchemaText);
            console.log("Found local schema, creating local dbs.");
            this.dbs = Promise.resolve(this.schemas.map(this.createLocalDb));
        }
        else {
            console.log("No local dbs found, requesting remote schema.");
            this.dbs = this.call(RemoteDb_1.RemoteDbEventType.SCHEMA).then((schema) => this.onRemoteSchema(schema, true));
        }
    }
    getDb(name) {
        return this.dbs.then((dbs) => dbs.find((d) => d.getSchema().name === name));
    }
}
exports.default = WsDbClient;
