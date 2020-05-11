"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Dispatcher_1 = require("../common/Dispatcher");
const WsDbInterfaces_1 = require("../common/WsDbInterfaces");
const ClientDb_1 = require("./ClientDb");
/**
 *
 * @author Rodrigo Portela
 */
class ObservableDb {
    constructor(schema) {
        this.db = new ClientDb_1.default(schema);
        this.listeners = {};
        for (const col of schema.collections) {
            this.listeners[col.name] = new Dispatcher_1.default();
        }
    }
    /**
     *
     * @param collection
     * @param key
     * @param params
     */
    _notify(collection, key, ...params) {
        const d = this.listeners[collection];
        d.dispatch(key, params);
    }
    /**
     *
     */
    getSchema() {
        return this.db.getSchema();
    }
    /**
     *
     * @param collection
     * @param record
     * @param key
     */
    add(collection, record, key) {
        return this.db.add(collection, record, key).then((key) => {
            this._notify(collection, WsDbInterfaces_1.WsDbActions.INSERTED, record);
            return key;
        });
    }
    /**
     *
     * @param collection
     * @param record
     * @param key
     */
    put(collection, record, key) {
        return this.db.put(collection, record, key).then((key) => {
            this._notify(collection, WsDbInterfaces_1.WsDbActions.UPDATED, record);
            return key;
        });
    }
    /**
     *
     * @param collection
     * @param id
     */
    delete(collection, id) {
        return this.db.delete(collection, id).then((id) => {
            this._notify(collection, WsDbInterfaces_1.WsDbActions.DELETED, id);
            return id;
        });
    }
    /**
     *
     * @param collection
     * @param query
     */
    query(collection, query) {
        return this.db.query(collection, query);
    }
    /**
     *
     * @param collection
     * @param query
     */
    get(collection, query) {
        return this.db.get(collection, query);
    }
    addListener(collection, key, listener) {
        const dispatch = this.listeners[collection];
        dispatch.register(key, listener);
    }
    removeListener(collection, key, listener) {
        const dispatch = this.listeners[collection];
        dispatch.unregister(key, listener);
    }
}
exports.default = ObservableDb;
