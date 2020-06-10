"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const DbEvents_1 = require("../common/DbEvents");
const DbFilters_1 = require("../common/DbFilters");
const RemoteDb_1 = require("../common/RemoteDb");
const JsonRpcServer_1 = require("./JsonRpcServer");
class RemoteDbServer extends JsonRpcServer_1.JsonRpcServer {
    constructor(databases) {
        super();
        this.onAdd = (client, event) => {
            this.getDatabase(event.db)
                .add(event.collection, event.record)
                .then(() => {
                this.broadcast(DbEvents_1.DbEventType.ADD, event, client.id);
            });
        };
        this.onPut = (client, event) => {
            this.getDatabase(event.db)
                .put(event.collection, event.record)
                .then(() => {
                this.broadcast(DbEvents_1.DbEventType.PUT, event, client.id);
            });
        };
        this.onDelete = (client, event) => {
            this.getDatabase(event.db)
                .delete(event.collection, event.key)
                .then(() => {
                this.broadcast(DbEvents_1.DbEventType.DELETE, event, client.id);
            });
        };
        this.onSchema = () => this.databases.map((d) => d.getSchema());
        this.onQuery = (client, event) => {
            const select = this.getDatabase(event.db).select(event.collection);
            select._where = event.where
                ? new DbFilters_1.DbFilterExpression(event.where)
                : undefined;
            select._orderBy = event.order;
            select._offset = event.offset;
            select._limit = event.limit;
            return select.all();
        };
        this.onScalar = (client, event) => {
            const select = this.getDatabase(event.db).select(event.collection);
            select._where = event.where
                ? new DbFilters_1.DbFilterExpression(event.where)
                : undefined;
            select._orderBy = event.order;
            return select.first();
        };
        this.onSync = (client, event) => {
            const db = this.getDatabase(event.db);
            const select = db.select(event.collection);
            if (event.lastUpdatedAt)
                select.where(new DbFilters_1.DbFilterTerm("updatedAt", DbFilters_1.DbFilterComparison.GREATER_THAN, event.lastUpdatedAt));
            const colSchema = db
                .getSchema()
                .collections.find((c) => c.name === event.collection);
            select.forEach((record) => {
                const not = {
                    db: event.db,
                    collection: event.collection,
                    record: record,
                    keyPath: colSchema.keyPath,
                    key: record[colSchema.keyPath.toString()],
                };
                console.log("Notifying record to put", event.db, event.collection, not);
                client.notify(DbEvents_1.DbEventType.PUT, {
                    db: event.db,
                    collection: event.collection,
                    record: record,
                });
            });
        };
        this.databases = databases;
        super.setHandler(DbEvents_1.DbEventType.ADD, this.onAdd);
        super.setHandler(DbEvents_1.DbEventType.PUT, this.onPut);
        super.setHandler(DbEvents_1.DbEventType.DELETE, this.onDelete);
        super.setHandler(RemoteDb_1.RemoteDbEventType.SCHEMA, this.onSchema);
        super.setHandler(RemoteDb_1.RemoteDbEventType.SCALAR, this.onScalar);
        super.setHandler(RemoteDb_1.RemoteDbEventType.QUERY, this.onQuery);
        super.setHandler(RemoteDb_1.RemoteDbEventType.SYNC, this.onSync);
    }
    getDatabase(name) {
        for (const db of this.databases)
            if (name === db.getSchema().name)
                return db;
        throw new Error("Database not found: " + name);
    }
}
exports.default = RemoteDbServer;
