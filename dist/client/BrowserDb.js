"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Db_1 = require("../common/Db");
const BrowserDbSelect_1 = require("./BrowserDbSelect");
/**
 * IndexedDB is a low-level API for client-side storage of significant amounts of structured data, including files/blobs.
 * This API uses indexes to enable high-performance searches of this data.
 *
 * @author Rodrigo Portela
 */
class BrowserDb {
    constructor(schema) {
        /**
         * The onupgradeneeded property of the IDBOpenDBRequest interface is the event handler for the upgradeneeded event,
         * triggered when a database of a bigger version number than the existing stored database is loaded.
         */
        this.onUpgradeNeeded = (event) => {
            const target = event.target;
            const db = target.result;
            for (const name of db.objectStoreNames)
                db.deleteObjectStore(name);
            for (const col of this.schema.collections)
                this.createCollection(db, col);
        };
        this.schema = schema;
        this.open = new Promise((resolve, reject) => {
            const req = indexedDB.open(schema.name, schema.version);
            req.onsuccess = () => resolve(req.result);
            req.onerror = () => reject(req.error);
            req.onupgradeneeded = this.onUpgradeNeeded;
            req.onblocked = () => reject(new Error("This database is blocked, you should probably refresh your browser."));
        });
    }
    select(collection) {
        return new BrowserDbSelect_1.default(this, collection);
    }
    /**
     * Creates a new collection based on the schema definition.
     *
     * @param db
     * @param collection
     */
    createCollection(db, collection) {
        const store = db.createObjectStore(collection.name, {
            keyPath: collection.keyPath,
            autoIncrement: collection.autoIncrement,
        });
        if (collection.indexes)
            for (const index of collection.indexes)
                store.createIndex(index.name, index.keyPath, {
                    unique: index.unique,
                });
    }
    /**
     * Gets the current IDBDatabase promise for avanced programming.
     */
    getDb() {
        return this.open;
    }
    getSchema() {
        return this.schema;
    }
    /**
     * The add method is an insert only method.
     * If a record already exists in the object store with the key parameter as its key,
     * then an error ConstrainError event is fired on the returned request object.
     * For updating existing records, you should use the IDBObjectStore.put method instead.
     *
     * @param collection
     * @param record
     * @param key
     */
    add(collection, record) {
        return this.open.then((db) => new Promise((resolve, reject) => {
            const store = db
                .transaction(collection, "readwrite")
                .objectStore(collection);
            const kp = store.keyPath;
            record["created_at"] = new Date();
            if (!store.autoIncrement)
                record[kp] = Db_1.createId();
            const req = store.add(record);
            req.onerror = () => reject(req.error);
            req.onsuccess = () => resolve({
                collection: store.name,
                key: req.result,
                keyPath: kp,
                record: record,
                db: this.schema.name,
            });
        }));
    }
    /**
     * The put method is an update or insert method.
     * See the IDBObjectStore.add method for an insert only method.
     * Any of the following conditions apply and will raise errors:
     * The object store uses in-line keys or has a key generator, and a key parameter was provided.
     * The object store uses out-of-line keys and has no key generator, and no key parameter was provided.
     * The object store uses in-line keys but no key generator, and the object store's key path does not yield a valid key.
     * The key parameter was provided but does not contain a valid key.
     *
     * @param collection
     * @param record
     * @param key
     */
    put(collection, record) {
        return this.open.then((db) => new Promise((resolve, reject) => {
            const store = db
                .transaction(collection, "readwrite")
                .objectStore(collection);
            const kp = store.keyPath;
            record["updated_at"] = new Date();
            if (!store.autoIncrement && !record[kp])
                record[kp] = Db_1.createId();
            const req = store.put(record);
            req.onerror = () => reject(req.error);
            req.onsuccess = () => resolve({
                collection: store.name,
                key: req.result,
                keyPath: kp,
                record: record,
                db: this.schema.name,
            });
        }));
    }
    /**
     * The delete() method of the IDBObjectStore interface returns an IDBRequest object,
     * and, in a separate thread, deletes the specified record or records.
     * Either a key or an IDBKeyRange can be passed,
     * allowing one or multiple records to be deleted from a store.
     * To delete all records in a store, use  IDBObjectStore.clear.
     *
     * @param collection
     * @param key
     */
    delete(collection, key) {
        return this.open.then((db) => new Promise((resolve, reject) => {
            const store = db
                .transaction(collection, "readwrite")
                .objectStore(collection);
            const req = store.delete(key);
            req.onerror = () => reject(req.error);
            req.onsuccess = () => resolve({
                collection: store.name,
                keyPath: store.keyPath,
                key: key,
                db: this.schema.name,
            });
        }));
    }
    /**
     * The clear() method of the IDBObjectStore interface creates and immediately returns an IDBRequest object,
     * and clears this object store in a separate thread.
     * This is for deleting all the current data out of an object store.
     * Clearing an object store consists of removing all records from the object store and removing all records in indexes
     * that reference the object store. To remove only some of the records in a store,
     * use IDBObjectStore.delete passing a key or IDBKeyRange.
     *
     * @param collection
     */
    clear(collection) {
        return this.open.then((db) => new Promise((resolve, reject) => {
            const req = db
                .transaction(collection, "readwrite")
                .objectStore(collection)
                .clear();
            req.onerror = () => reject(req.error);
            req.onsuccess = () => resolve({
                db: this.schema.name,
                collection: collection,
            });
        }));
    }
    /**
     * The count() method of the IDBObjectStore interface returns an IDBRequest object, and, in a separate thread,
     * returns the total number of records that match the provided key or IDBKeyRange.
     * If no arguments are provided, it returns the total number of records in the store.
     *
     * @param collection
     * @param key
     */
    count(collection, key) {
        return this.open.then((db) => new Promise((resolve, reject) => {
            const req = db
                .transaction(collection)
                .objectStore(collection)
                .count(key);
            req.onerror = () => reject(req.error);
            req.onsuccess = () => resolve(req.result);
        }));
    }
    /**
     * Retrieves the value of the first record matching the given key or key range in query.
     * If successful, request's result will be the value, or undefined if there was no matching record.
     *
     * @param collection
     * @param query
     */
    get(collection, query) {
        return this.open.then((db) => new Promise((resolve, reject) => {
            const req = db
                .transaction(collection)
                .objectStore(collection)
                .get(query);
            req.onerror = () => reject(req.error);
            req.onsuccess = () => resolve(req.result);
        }));
    }
    /**
     * Retrieves the values of the records matching the given key or key range in query (up to count if given).
     * If successful, request's result will be an Array of the values.
     *
     * @param collection
     * @param query
     * @param count
     */
    getAll(collection, query, count) {
        return this.open.then((db) => new Promise((resolve, reject) => {
            const req = db
                .transaction(collection)
                .objectStore(collection)
                .getAll(query, count);
            req.onerror = () => reject(req.error);
            req.onsuccess = () => resolve(req.result);
        }));
    }
    /**
     * Retrieves the keys of records matching the given key or key range in query (up to count if given).
     * If successful, request's result will be an Array of the keys.
     * @param collection
     * @param query
     * @param count
     */
    getAllKeys(collection, query, count) {
        return this.open.then((db) => new Promise((resolve, reject) => {
            const req = db
                .transaction(collection)
                .objectStore(collection)
                .getAllKeys(query, count);
            req.onerror = () => reject(req.error);
            req.onsuccess = () => resolve(req.result);
        }));
    }
    /**
     * Opens a cursor over the records matching query, ordered by direction. If query is null, all records in store are matched.
     * If successful, request's result will be an IDBCursorWithValue pointing at the first matching record, or null if there were no matching records.
     *
     * @param collection
     */
    forEach(collection, fn, query, direction) {
        return this.open.then((db) => new Promise((resolve, reject) => {
            const req = db
                .transaction(collection, "readwrite")
                .objectStore(collection)
                .openCursor(query, direction);
            req.onerror = () => reject(req.error);
            req.onsuccess = () => {
                const cursor = req.result;
                if (cursor) {
                    fn(cursor);
                }
                else
                    resolve();
            };
        }));
    }
    /**
     * Retrieves record keys for all objects in the object store matching the specified parameter
     * or all objects in the store if no parameters are given.
     *
     * @param collection
     * @param fn
     * @param query
     * @param direction
     */
    forEachKey(collection, fn, query, direction) {
        return this.open.then((db) => new Promise((resolve, reject) => {
            const req = db
                .transaction(collection, "readwrite")
                .objectStore(collection)
                .openKeyCursor(query, direction);
            req.onerror = () => reject(req.error);
            req.onsuccess = () => {
                const cursor = req.result;
                if (cursor) {
                    fn(cursor);
                }
                else
                    resolve();
            };
        }));
    }
}
exports.default = BrowserDb;
