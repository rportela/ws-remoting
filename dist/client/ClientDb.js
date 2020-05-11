"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Db_1 = require("../common/Db");
const Dispatcher_1 = require("../common/Dispatcher");
/**
 * This class wraps a local indexedb and exposes method to allow syncing and adding;
 *
 * @author Rodrigo Portela
 */
class ClientDb {
    /**
     * This method constructs a client db with a specific schema;
     *
     * @param schema
     */
    constructor(schema) {
        /**
         * This method performs the upgrade of the database with a new schema.
         */
        this._upgrade = (event) => {
            const target = event.target;
            const db = target.result;
            for (const col of this.schema.collections) {
                if (db.objectStoreNames.contains(col.name)) {
                    db.deleteObjectStore(col.name);
                }
                const store = db.createObjectStore(col.name, {
                    keyPath: col.keyPath,
                    autoIncrement: col.autoIncrement,
                });
                if (col.indexes) {
                    for (const idx of col.indexes)
                        store.createIndex(idx.property, idx.property, { unique: idx.unique });
                }
            }
        };
        this.schema = schema;
        this.listeners = {};
        for (const col of schema.collections) {
            this.listeners[col.name] = new Dispatcher_1.default();
        }
        this.opening = new Promise((resolve, reject) => {
            const req = indexedDB.open(schema.name, schema.version);
            req.onsuccess = () => {
                this.db = req.result;
                resolve(this);
            };
            req.onerror = () => reject(req.error);
            req.onupgradeneeded = this._upgrade;
            req.onblocked = () => reject(new Error("Blocked, you should probably refresh your browser"));
        });
    }
    /**
     *
     * @param collection
     * @param record
     */
    add(collection, record, key) {
        return this.opening.then(() => new Promise((resolve, reject) => {
            const req = this.db
                .transaction(collection, "readwrite")
                .objectStore(collection)
                .add(record, key);
            req.onerror = () => reject(req.error);
            req.onsuccess = () => {
                this.notifyListener(collection, Db_1.DbActions.INSERTED, record);
                resolve(req.result);
            };
        }));
    }
    /**
     *
     * @param collection
     * @param record
     */
    put(collection, record, key) {
        return this.opening.then(() => new Promise((resolve, reject) => {
            const req = this.db
                .transaction(collection, "readwrite")
                .objectStore(collection)
                .put(record, key);
            req.onerror = () => reject(req.error);
            req.onsuccess = () => {
                this.notifyListener(collection, record.id, record);
                resolve(req.result);
            };
        }));
    }
    /**
     *
     * @param collection
     * @param id
     */
    delete(collection, id) {
        return this.opening.then(() => new Promise((resolve, reject) => {
            const req = this.db
                .transaction(collection, "readwrite")
                .objectStore(collection)
                .delete(id);
            req.onerror = () => reject(req.error);
            req.onsuccess = () => {
                this.notifyListener(collection, Db_1.DbActions.DELETED, id);
                resolve(id);
            };
        }));
    }
    /**
     *
     */
    getSchema() {
        return this.schema;
    }
    /**
     *
     */
    get(collection, query) {
        return this.opening.then(() => new Promise((resolve, reject) => {
            const req = this.db
                .transaction(collection)
                .objectStore(collection)
                .get(query);
            req.onsuccess = () => resolve(req.result);
            req.onerror = () => reject(req.error);
        }));
    }
    /**
     *
     * @param collection
     * @param query
     * @param direction
     */
    query(collection, query, direction) {
        return this.opening.then(() => new Promise((resolve, reject) => {
            const req = this.db
                .transaction(collection)
                .objectStore(collection)
                .openCursor(query, direction);
            const list = [];
            req.onerror = () => reject(req.error);
            req.onsuccess = () => {
                if (req.result) {
                    list.push(req.result.value);
                    req.result.continue();
                }
                else {
                    resolve(list);
                }
            };
        }));
    }
    addListener(collection, key, listener) {
        const dispatch = this.listeners[collection];
        dispatch.register(key, listener);
    }
    removeListener(collection, key, listener) {
        const dispatch = this.listeners[collection];
        dispatch.unregister(key, listener);
    }
    notifyListener(collection, key, params) {
        const dispatch = this.listeners[collection];
        if (dispatch)
            dispatch.dispatch(key, params);
        else
            console.log("ops, null dispatchers for ", collection, key);
    }
}
exports.default = ClientDb;
