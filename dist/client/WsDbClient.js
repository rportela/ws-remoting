"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Db_1 = require("../common/Db");
const WsDb_1 = require("../common/WsDb");
const BrowserDb_1 = require("./BrowserDb");
const ObservableDb_1 = require("./ObservableDb");
const WsClient_1 = require("./WsClient");
class WsDbClient {
    constructor(url) {
        this.onConnect = () => {
            this.messagedb.all("message").then((message) => message.forEach((message) => {
                this.socket
                    .call(message.action, message.params)
                    .then(() => this.messagedb.delete("message", message.id));
            }));
            this.opening.then((dbs) => dbs.forEach(this.fetchDbRecords));
        };
        this.fetchDbRecords = (db) => {
            db.getSchema().collections.forEach((col) => this.fetchCollectionRecords(db, col));
        };
        this.onError = (err) => {
            console.error(err);
        };
        this.onServerDelete = (params) => {
            this.getDb(params.db).then((db) => db.delete(params.collection, params.key).catch((err) => {
                console.error(err);
                db.notifyListeners(params.collection, Db_1.DbEvent.DELETED, params.key);
            }));
        };
        this.onServerInsert = (params) => {
            this.getDb(params.db).then((db) => db.insert(params.collection, params.record).catch((err) => {
                console.error(err);
                db.notifyListeners(params.collection, Db_1.DbEvent.INSERTED, params.record);
            }));
        };
        this.onServerUpdate = (params) => {
            this.getDb(params.db).then((db) => db.update(params.collection, params.record).catch((err) => {
                console.error(err);
                db.notifyListeners(params.collection, Db_1.DbEvent.UPDATED, params.record);
            }));
        };
        this.onClientDelete = (params) => {
            this.notifyServer(WsDb_1.WsDbEvent.DELETED, params);
        };
        this.onClientInsert = (params) => {
            this.notifyServer(WsDb_1.WsDbEvent.INSERTED, params);
        };
        this.onClientUpdate = (params) => {
            this.notifyServer(WsDb_1.WsDbEvent.UPDATED, params);
        };
        this.onSchema = (schema) => schema.map((s) => {
            const db = new ObservableDb_1.ObservableDb(s);
            s.collections.forEach((col) => {
                db.addListener(col.name, Db_1.DbEvent.DELETED, this.onClientDelete);
                db.addListener(col.name, Db_1.DbEvent.INSERTED, this.onClientInsert);
                db.addListener(col.name, Db_1.DbEvent.UPDATED, this.onClientUpdate);
            });
            return db;
        });
        this.socket = new WsClient_1.WsClient(url);
        this.socket.addListener(WsClient_1.WsClientAction.CONNECT, this.onConnect);
        this.socket.addListener(WsClient_1.WsClientAction.ERROR, this.onError);
        this.socket.addListener(WsDb_1.WsDbEvent.DELETED, this.onServerDelete);
        this.socket.addListener(WsDb_1.WsDbEvent.INSERTED, this.onServerInsert);
        this.socket.addListener(WsDb_1.WsDbEvent.UPDATED, this.onServerUpdate);
        this.opening = this.socket.call(WsDb_1.WsDbEvent.SCHEMA, null).then(this.onSchema);
        this.messagedb = new BrowserDb_1.default({
            name: "messagedb",
            version: 1,
            collections: [{ name: "message", keyPath: "id", autoIncrement: true }],
        });
    }
    notifyServer(action, params) {
        this.messagedb
            .add("message", {
            action: action,
            params: params,
        })
            .then((key) => {
            this.socket.call(action, params).then((res) => {
                this.messagedb.delete("message", key);
                return res;
            });
        });
    }
    fetchCollectionRecords(db, collection) {
        db.select(collection.name)
            .orderBy("updated_at", true)
            .first()
            .then((last) => {
            const query = {
                db: db.getSchema().name,
                collection: collection.name,
                where: last
                    ? new Db_1.DbFilterTerm("updated_at", Db_1.DbFilterComparison.GREATER_THAN, last.updated_at)
                    : undefined,
            };
            this.socket.call(WsDb_1.WsDbEvent.QUERY, query).then((results) => {
                if (results && results.forEach)
                    results.forEach((result) => db.upsert(collection.name, result));
            });
        });
    }
    getDb(name) {
        return this.opening.then((dbs) => dbs.find((db) => db.getSchema().name == name));
    }
}
exports.default = WsDbClient;
