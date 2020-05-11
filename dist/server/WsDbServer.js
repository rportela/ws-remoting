"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const WsServer_1 = require("./WsServer");
const WsDbActions_1 = require("../common/WsDbActions");
class WsDbServer extends WsServer_1.WsServer {
    constructor(databases, options) {
        super(options);
        this.on_inserted = (sender, params) => {
            this.getDatabase(params.db)
                .add(params.name, params.record)
                .then(() => this.broadcast(WsDbActions_1.default.INSERTED, params, sender));
        };
        this.on_updated = (sender, params) => {
            this.getDatabase(params.db)
                .put(params.name, params.record)
                .then(() => this.broadcast(WsDbActions_1.default.UPDATED, params, sender));
        };
        this.on_deleted = (sender, params) => {
            this.getDatabase(params.db)
                .delete(params.name, params.key)
                .then(() => this.broadcast(WsDbActions_1.default.DELETED, params, sender));
        };
        this.on_get_schema = (sender, db_name) => {
            return this.getDatabase(db_name).getSchema();
        };
        this.on_get = (sender, params) => {
            return this.getDatabase(params.db).get(params.name, params.query);
        };
        this.on_query = (sender, params) => {
            return this.getDatabase(params.db).query(params.name, params.query);
        };
        this.databases = databases;
        this.register(WsDbActions_1.default.INSERTED, this.on_inserted);
        this.register(WsDbActions_1.default.UPDATED, this.on_updated);
        this.register(WsDbActions_1.default.DELETED, this.on_deleted);
        this.register(WsDbActions_1.default.SCHEMA, this.on_get_schema);
        this.register(WsDbActions_1.default.GET, this.on_get);
        this.register(WsDbActions_1.default.QUERY, this.on_query);
    }
    getDatabase(name) {
        for (const db of this.databases)
            if (name === db.getSchema().name)
                return db;
        throw new Error("Database not found: " + name);
    }
}
exports.default = WsDbServer;
