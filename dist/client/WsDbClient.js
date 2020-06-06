"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Db_1 = require("../common/Db");
const WsDb_1 = require("../common/WsDb");
const JsonRpcClient_1 = require("./JsonRpcClient");
const ObservableDb_1 = require("./ObservableDb");
const WebSocketClient_1 = require("./WebSocketClient");
const WS_DB_SCHEMA = "WS_DB_SCHEMA";
class WsDbClient extends JsonRpcClient_1.default {
    constructor(addess, protocols) {
        super(addess, protocols);
        this.onRecordAdd = (event) => {
            this.notify(WsDb_1.WsDbEventType.ADD, event);
        };
        this.onRecordPut = (event) => {
            this.notify(Db_1.DbEventType.PUT, event);
        };
        this.onRecordDelete = (event) => {
            this.notify(Db_1.DbEventType.DELETE, event);
        };
        this.onRemoteRecordAdd = (event) => {
            const db = this.getDb(event.db);
            if (db)
                db.add(event.collection, event.record);
        };
        this.onRemoteRecordPut = (event) => {
            const db = this.getDb(event.db);
            if (db)
                db.put(event.collection, event.record);
        };
        this.onRemoteRecordDelete = (event) => {
            const db = this.getDb(event.db);
            if (db)
                db.delete(event.collection, event.key);
        };
        this.createLocalDb = (schema) => {
            const db = new ObservableDb_1.default(schema);
            db.on(Db_1.DbEventType.ADD, this.onRecordAdd);
            db.on(Db_1.DbEventType.PUT, this.onRecordPut);
            db.on(Db_1.DbEventType.DELETE, this.onRecordDelete);
            return db;
        };
        this.callSync = (db) => {
            for (const col of db.getSchema().collections) {
                db.all(col.name).then((all) => {
                    const lastUpdatedAt = all && all.length > 0
                        ? all.sort((a, b) => b["updated_at"] - a["updated_at"]).pop()
                            .updated_at
                        : undefined;
                    const event = {
                        collection: col.name,
                        db: db.getSchema().name,
                        lastUpdatedAt: lastUpdatedAt,
                    };
                    this.notify(WsDb_1.WsDbEventType.SYNC, event);
                });
            }
            return;
        };
        this.refreshLocalDbs = () => {
            return this.call(WsDb_1.WsDbEventType.SCHEMA)
                .then((schemas) => {
                localStorage.setItem(WS_DB_SCHEMA, JSON.stringify(schemas));
                return this.dbs
                    ? Promise.all(this.dbs.map(this.closeLocalDb)).then(() => schemas)
                    : Promise.resolve(schemas);
            })
                .then((schemas) => {
                this.dbs = schemas.map(this.createLocalDb);
                this.dbs.forEach(this.callSync);
                this.onDbAvailable(this);
            });
        };
        this.onDbAvailable = (wsdb) => void {};
        this.loadLocalDbs();
        this.setHandler(Db_1.DbEventType.ADD, this.onRemoteRecordAdd);
        this.setHandler(Db_1.DbEventType.PUT, this.onRemoteRecordPut);
        this.setHandler(Db_1.DbEventType.DELETE, this.onRemoteRecordDelete);
        this.setHandler(WebSocketClient_1.ClientSocketEventType.CONNECT, this.refreshLocalDbs);
    }
    closeLocalDb(db) {
        db.off(Db_1.DbEventType.ADD, this.onRecordAdd);
        db.off(Db_1.DbEventType.PUT, this.onRecordPut);
        db.off(Db_1.DbEventType.DELETE, this.onRecordDelete);
        return db.close();
    }
    loadLocalDbs() {
        const localSchemaText = localStorage.getItem(WS_DB_SCHEMA);
        if (localSchemaText) {
            this.schemas = JSON.parse(localSchemaText);
            this.dbs = this.schemas.map(this.createLocalDb);
            this.onDbAvailable(this);
        }
    }
    getDb(name) {
        return this.dbs ? this.dbs.find((d) => d.getSchema().name === name) : null;
    }
}
exports.default = WsDbClient;
