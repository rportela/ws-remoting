"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Db_1 = require("../common/Db");
const WsDb_1 = require("../common/WsDb");
const WsServer_1 = require("./WsServer");
class WsDbServer extends WsServer_1.WsServer {
    constructor(databases, options) {
        super(options);
        this.onInsert = (sender, event) => {
            this.getDatabase(event.db)
                .insert(event.collection, event.record)
                .then(() => {
                this.broadcast(WsDb_1.WsDbEvent.INSERTED, event, sender);
            });
        };
        this.onUpdate = (sender, event) => {
            this.getDatabase(event.db)
                .update(event.collection, event.record)
                .then(() => {
                this.broadcast(WsDb_1.WsDbEvent.UPDATED, event, sender);
            });
        };
        this.onDelete = (sender, event) => {
            this.getDatabase(event.db)
                .delete(event.collection, event.key)
                .then(() => {
                this.broadcast(WsDb_1.WsDbEvent.DELETED, event, sender);
            });
        };
        this.onSchema = (sender, event) => this.databases.map((d) => d.getSchema());
        this.onQuery = (sender, event) => {
            const select = this.getDatabase(event.db).select(event.collection);
            select._where = event.where
                ? new Db_1.DbFilterExpression(event.where)
                : undefined;
            select._order = event.order;
            select._offset = event.offset;
            select._limit = event.limit;
            return select.toArray();
        };
        this.onScalar = (sender, event) => {
            const select = this.getDatabase(event.db).select(event.collection);
            select._where = event.where
                ? new Db_1.DbFilterExpression(event.where)
                : undefined;
            select._order = event.order;
            return select.first();
        };
        this.databases = databases;
        this.register(WsDb_1.WsDbEvent.INSERTED, this.onInsert);
        this.register(WsDb_1.WsDbEvent.UPDATED, this.onUpdate);
        this.register(WsDb_1.WsDbEvent.DELETED, this.onDelete);
        this.register(WsDb_1.WsDbEvent.SCHEMA, this.onSchema);
        this.register(WsDb_1.WsDbEvent.SCALAR, this.onScalar);
        this.register(WsDb_1.WsDbEvent.QUERY, this.onQuery);
    }
    getDatabase(name) {
        for (const db of this.databases)
            if (name === db.getSchema().name)
                return db;
        throw new Error("Database not found: " + name);
    }
}
exports.default = WsDbServer;
