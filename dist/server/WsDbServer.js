"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Db_1 = require("../common/Db");
const WsDb_1 = require("../common/WsDb");
const JsonRpcServer_1 = require("./JsonRpcServer");
class WsDbServer extends JsonRpcServer_1.JsonRpcServer {
    constructor(databases) {
        super();
        this.onAdd = (client, event) => {
            this.getDatabase(event.db)
                .add(event.collection, event.record)
                .then(() => {
                this.broadcast(Db_1.DbEventType.ADD, event, client.id);
            });
        };
        this.onPut = (client, event) => {
            this.getDatabase(event.db)
                .put(event.collection, event.record)
                .then(() => {
                this.broadcast(Db_1.DbEventType.PUT, event, client.id);
            });
        };
        this.onDelete = (client, event) => {
            this.getDatabase(event.db)
                .delete(event.collection, event.key)
                .then(() => {
                this.broadcast(Db_1.DbEventType.DELETE, event, client.id);
            });
        };
        this.onSchema = () => this.databases.map((d) => d.getSchema());
        this.onQuery = (client, event) => {
            const select = this.getDatabase(event.db).select(event.collection);
            select._where = event.where
                ? new Db_1.DbFilterExpression(event.where)
                : undefined;
            select._orderBy = event.order;
            select._offset = event.offset;
            select._limit = event.limit;
            return select.all();
        };
        this.onScalar = (client, event) => {
            const select = this.getDatabase(event.db).select(event.collection);
            select._where = event.where
                ? new Db_1.DbFilterExpression(event.where)
                : undefined;
            select._orderBy = event.order;
            return select.first();
        };
        this.onSync = (client, event) => {
        };
        this.databases = databases;
        super.setHandler(Db_1.DbEventType.ADD, this.onAdd);
        super.setHandler(Db_1.DbEventType.PUT, this.onPut);
        super.setHandler(Db_1.DbEventType.DELETE, this.onDelete);
        super.setHandler(WsDb_1.WsDbEventType.SCHEMA, this.onSchema);
        super.setHandler(WsDb_1.WsDbEventType.SCALAR, this.onScalar);
        super.setHandler(WsDb_1.WsDbEventType.QUERY, this.onQuery);
        super.setHandler(WsDb_1.WsDbEventType.SYNC, this.onSync);
    }
    getDatabase(name) {
        for (const db of this.databases)
            if (name === db.getSchema().name)
                return db;
        throw new Error("Database not found: " + name);
    }
}
exports.default = WsDbServer;
