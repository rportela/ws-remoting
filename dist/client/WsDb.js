"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ClientDb_1 = require("./ClientDb");
const WsClient_1 = require("./WsClient");
const Db_1 = require("../common/Db");
const WsDbActions_1 = require("../common/WsDbActions");
class WsDb {
    constructor(url, db) {
        this._onRecordInserted = (params) => {
            console.log("got a record inserted");
            const schema = this.getSchema();
            if (params.db === schema.name) {
                console.log("attempting to add a new record.");
                this.db.add(params.name, params.record).catch((reason) => {
                    console.error(reason);
                    this.db.notifyListener(params.name, Db_1.DbActions.INSERTED, params.record);
                });
            }
        };
        this._onRecordUpdated = (params) => {
            const schema = this.getSchema();
            if (params.db === schema.name) {
                this.db.put(params.name, params.record);
            }
        };
        this._onRecordDeleted = (params) => {
            const schema = this.getSchema();
            if (params.db === schema.name) {
                this.db.delete(params.name, params.key);
            }
        };
        this._receiveSchema = (schema) => {
            this.db = new ClientDb_1.default(schema);
            this.messagedb = new ClientDb_1.default({
                name: "messagedb",
                version: 1,
                collections: [{ name: "messages", keyPath: "id", autoIncrement: true }],
            });
            return this.db;
        };
        this._sync = () => {
            if (this.messagedb) {
                this.messagedb.query("messages").then((messages) => {
                    for (const message of messages)
                        this.socket
                            .call(message.action, message.params)
                            .then(() => this.messagedb.delete("messages", message.id));
                });
            }
        };
        this._dispatchErrors = (error) => {
            console.error(error);
        };
        this.socket = new WsClient_1.WsClient(url);
        this.socket.addListener(WsClient_1.WsClientAction.CONNECT, this._sync);
        this.socket.addListener(WsClient_1.WsClientAction.ERROR, this._dispatchErrors);
        this.socket.addListener(WsDbActions_1.default.DELETED, this._onRecordDeleted);
        this.socket.addListener(WsDbActions_1.default.INSERTED, this._onRecordInserted);
        this.socket.addListener(WsDbActions_1.default.UPDATED, this._onRecordUpdated);
        this.opening = this.socket
            .call(WsDbActions_1.default.SCHEMA, db)
            .then(this._receiveSchema);
    }
    _notify(message) {
        return this.messagedb
            .add("messages", message)
            .then((id) => this.socket
            .call(message.action, message.params)
            .then((result) => this.messagedb.delete("messages", id).then(() => result)));
    }
    /**
     *
     */
    createId() {
        return new Date().getTime().toString(36) + "_" + Math.random().toString(36);
    }
    /**
     *
     */
    getSchema() {
        return this.db ? this.db.getSchema() : null;
    }
    /**
     *
     * @param collection
     * @param record
     */
    add(collection, record) {
        record.id = this.createId();
        record.createAt = new Date();
        record.updatedAt = new Date();
        return this.opening.then((db) => db.add(collection, record).then((id) => {
            this._notify({
                action: WsDbActions_1.default.INSERTED,
                params: {
                    db: this.getSchema().name,
                    name: collection,
                    record: record,
                },
            });
            return id;
        }));
    }
    /**
     *
     * @param collection
     * @param record
     */
    put(collection, record) {
        record.updatedAt = new Date();
        return this.opening.then((db) => db.put(collection, record).then((id) => {
            this._notify({
                action: WsDbActions_1.default.UPDATED,
                params: {
                    db: this.getSchema().name,
                    name: collection,
                    record: record,
                },
            });
            return id;
        }));
    }
    /**
     *
     * @param collection
     * @param id
     */
    delete(collection, id) {
        return this.opening.then((db) => db.delete(collection, id).then((id) => {
            this._notify({
                action: WsDbActions_1.default.DELETED,
                params: {
                    db: this.getSchema().name,
                    name: collection,
                    key: id,
                },
            });
            return id;
        }));
    }
    /**
     *
     * @param collection
     * @param query
     */
    query(collection, query) {
        return this.opening.then((db) => db.query(collection, query));
    }
    /**
     *
     * @param collection
     * @param query
     */
    get(collection, query) {
        return this.opening.then((db) => db.get(collection, query));
    }
    /**
     *
     * @param collection
     * @param key
     * @param listener
     */
    addListener(collection, key, listener) {
        return this.opening.then((db) => {
            db.addListener(collection, key, listener);
        });
    }
    /**
     *
     * @param collection
     * @param key
     * @param listener
     */
    removeListener(collection, key, listener) {
        return this.opening.then((db) => db.removeListener(collection, key, listener));
    }
}
exports.default = WsDb;
