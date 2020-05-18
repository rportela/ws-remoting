"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Wraps an indexed db with promises to increase control and
 * developer productivity. This is dependent on the schema being
 * previously defined.
 *
 * @author Rodrigo Portela
 */
class BrowserDb {
    /**
     * Attempts to open a connection to the named database with the current version,
     * or 1 if it does not already exist.
     * If the request is successful request's result will be the connection.
     *
     * @param schema
     */
    constructor(schema) {
        /**
         * Performs a database upbrade based on a defined schema.
         * Old object stores are all deleted if not present on the schema.
         * Collections and their indexes defined on the schema are created.
         */
        this._upgrade = (event) => {
            const target = event.target;
            const db = target.result;
            for (const name of db.objectStoreNames)
                db.deleteObjectStore(name);
            this.schema.collections.forEach((col) => {
                const store = db.createObjectStore(col.name, {
                    keyPath: col.keyPath,
                    autoIncrement: col.autoIncrement,
                });
                if (col.indexes) {
                    for (const idx of col.indexes)
                        store.createIndex(idx.name, idx.name, { unique: idx.unique });
                }
            });
        };
        this.schema = schema;
        this.open = new Promise((resolve, reject) => {
            const req = indexedDB.open(schema.name, schema.version);
            req.onerror = () => reject(req.error);
            req.onsuccess = () => resolve(req.result);
            req.onupgradeneeded = this._upgrade;
            req.onblocked = () => reject(new Error("Blocked. Yout should probably refresh your browser."));
        });
    }
    /**
     * Gets the current database schema.
     */
    getSchema() {
        return this.schema;
    }
    /**
     * Adds or updates a record in store with the given value and key.
     * If the store uses in-line keys and key is specified a "DataError" DOMException will be thrown.
     * If put() is used, any existing record with the key will be replaced.
     * If add() is used, and if a record with the key already exists the request will fail, with request's error set to a "ConstraintError" DOMException.
     * If successful, request's result will be the record's key.
     *
     * @param collection
     * @param record
     * @param key
     */
    add(collection, record, key) {
        return this.open.then((db) => new Promise((resolve, reject) => {
            const req = db
                .transaction(collection, "readwrite")
                .objectStore(collection)
                .add(record, key);
            req.onsuccess = () => resolve(req.result);
            req.onerror = () => reject(req.error);
        }));
    }
    /**
     * Adds or updates a record in store with the given value and key.
     * If the store uses in-line keys and key is specified a "DataError" DOMException will be thrown.
     * If put() is used, any existing record with the key will be replaced.
     * If add() is used, and if a record with the key already exists the request will fail, with request's error set to a "ConstraintError" DOMException.
     * If successful, request's result will be the record's key.
     *
     * @param collection
     * @param record
     * @param key
     */
    put(collection, record, key) {
        return this.open.then((db) => new Promise((resolve, reject) => {
            const req = db
                .transaction(collection, "readwrite")
                .objectStore(collection)
                .put(record, key);
            req.onsuccess = () => resolve(req.result);
            req.onerror = () => reject(req.error);
        }));
    }
    /**
     * Deletes records in store with the given key or in the given key range in query.
     * If successful, request's result will be undefined.
     *
     * @param collection
     * @param key
     */
    delete(collection, key) {
        return this.open.then((db) => new Promise((resolve, reject) => {
            const req = db
                .transaction(collection, "readwrite")
                .objectStore(collection)
                .delete(key);
            req.onsuccess = () => resolve(req.result);
            req.onerror = () => reject(req.error);
        }));
    }
    /**
     * Opens a cursor over the records matching query, ordered by direction.
     * If query is null, all records in store are matched.
     * If successful, request's result will be an IDBCursorWithValue pointing at the first matching record, or null if there were no matching records.
     *
     * @param collection
     * @param query
     * @param direction
     */
    all(collection, query, direction) {
        return this.open.then((db) => new Promise((resolve, reject) => {
            const list = [];
            const req = db
                .transaction(collection)
                .objectStore(collection)
                .openCursor(query, direction);
            req.onerror = () => reject(req.error);
            req.onsuccess = () => {
                const cursor = req.result;
                if (cursor) {
                    const value = cursor.value;
                    list.push(value);
                    cursor.continue();
                }
                else {
                    resolve(list);
                }
            };
        }));
    }
    /**
     * Opens a cursor with key only flag set over the records matching query, ordered by direction.
     * If query is null, all records in store are matched.
     * If successful, request's result will be an IDBCursor pointing at the first matching record, or null if there were no matching records.
     *
     * @param collection
     * @param query
     * @param direction
     */
    allKeys(collection, query, direction) {
        return this.open.then((db) => new Promise((resolve, reject) => {
            const list = [];
            const req = db
                .transaction(collection)
                .objectStore(collection)
                .openKeyCursor(query, direction);
            req.onsuccess = () => {
                const cursor = req.result;
                if (cursor) {
                    const value = cursor.key;
                    list.push(value);
                    cursor.continue();
                }
                else {
                    resolve(list);
                }
            };
            req.onerror = () => reject(req.error);
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
            req.onsuccess = () => resolve(req.result);
            req.onerror = () => reject(req.error);
        }));
    }
    /**
     * The execution of a real query.
     *
     * @param collection
     * @param where
     * @param orderBy
     * @param offset
     * @param limit
     */
    query(collection, where = null, orderBy = null, offset = 0, limit = 0) {
        return this.all(collection).then((all) => {
            if (where)
                all = all.filter((rec) => where.filterRecord(rec));
            if (orderBy)
                orderBy.sort(all);
            if (offset < 1 && limit < 1)
                return all;
            else {
                const result = [];
                let end = offset + limit;
                if (limit === 0 || end > all.length)
                    end = all.length;
                for (let i = offset; i < end; i++) {
                    result.push(all[i]);
                }
                return result;
            }
        });
    }
    /**
     * The first element of a query.
     *
     * @param collection
     * @param where
     * @param orderBy
     * @param offset
     * @param limit
     */
    first(collection, where = null, orderBy = null) {
        return this.query(collection, where, orderBy, 0, 1).then((arr) => arr.length > 0 ? arr[0] : null);
    }
}
exports.default = BrowserDb;
