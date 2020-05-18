"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Db_1 = require("../common/Db");
const Dispatcher_1 = require("../common/Dispatcher");
/**
 * Adds or updates a record in store with the given value and key.
 * If the store uses in-line keys and key is specified a "DataError" DOMException will be thrown.
 * If put() is used, any existing record with the key will be replaced.
 * If add() is used, and if a record with the key already exists the request will fail, with request's error set to a "ConstraintError" DOMException.
 * If successful, request's result will be the record's key.
 *
 * @param db
 * @param collection
 * @param record
 * @param key
 */
const dbAdd = (db, collection, record, key) => new Promise((resolve, reject) => {
    const req = db
        .transaction(collection, "readwrite")
        .objectStore(collection)
        .add(record, key);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
});
/**
 * Adds or updates a record in store with the given value and key.
 * If the store uses in-line keys and key is specified a "DataError" DOMException will be thrown.
 * If put() is used, any existing record with the key will be replaced.
 * If add() is used, and if a record with the key already exists the request will fail, with request's error set to a "ConstraintError" DOMException.
 * If successful, request's result will be the record's key.
 *
 * @param db
 * @param collection
 * @param record
 * @param key
 */
const dbPut = (db, collection, record, key) => new Promise((resolve, reject) => {
    const req = db
        .transaction(collection, "readwrite")
        .objectStore(collection)
        .put(record, key);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
});
/**
 * Deletes records in store with the given key or in the given key range in query.
 * If successful, request's result will be undefined.
 *
 * @param db
 * @param collection
 * @param key
 */
const dbDelete = (db, collection, key) => new Promise((resolve, reject) => {
    const req = db
        .transaction(collection, "readwrite")
        .objectStore(collection)
        .delete(key);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
});
/**
 * Opens a cursor over the records matching query, ordered by direction. If query is null, all records in store are matched.
 * If successful, request's result will be an IDBCursorWithValue pointing at the first matching record, or null if there were no matching records.
 * @param db
 * @param collection
 * @param query
 * @param direction
 */
/**
 * Opens a cursor over the records matching query, ordered by direction.
 * If query is null, all records in store are matched.
 * If successful, request's result will be an IDBCursorWithValue pointing at the first matching record, or null if there were no matching records.
 *
 * @param db
 * @param collection
 * @param query
 * @param direction
 */
const dbOpenCursor = (db, collection, query, direction) => new Promise((resolve, reject) => {
    const req = db
        .transaction(collection)
        .objectStore(collection)
        .openCursor(query, direction);
    req.onsuccess = () => resolve(req);
    req.onerror = () => reject(req.error);
});
/**
 * Opens a cursor with key only flag set over the records matching query, ordered by direction.
 * If query is null, all records in store are matched.
 * If successful, request's result will be an IDBCursor pointing at the first matching record, or null if there were no matching records.
 * @param db
 * @param collection
 * @param query
 * @param direction
 */
const dbOpenKeyCursor = (db, collection, query, direction) => new Promise((resolve, reject) => {
    const req = db
        .transaction(collection)
        .objectStore(collection)
        .openKeyCursor(query, direction);
    req.onsuccess = () => resolve(req);
    req.onerror = () => reject(req.error);
});
/**
 * Opens a cursor over the records matching query, ordered by direction.
 * If query is null, all records in index are matched.
 * If successful, request's result will be an IDBCursorWithValue, or null if there were no matching records.
 *
 * @param db
 * @param collection
 * @param index
 * @param query
 * @param direction
 */
const dbOpenIndexCursor = (db, collection, index, query, direction) => new Promise((resolve, reject) => {
    const req = db
        .transaction(collection)
        .objectStore(collection)
        .index(index)
        .openCursor(query, direction);
    req.onsuccess = () => resolve(req);
    req.onerror = () => reject(req.error);
});
/**
 *
 * @param db
 * @param collection
 * @param visitor
 * @param query
 * @param direction
 */
const dbApplyVisitor = (db, collection, visitor, query, direction) => {
    return dbOpenCursor(db, collection, query, direction).then((req) => {
        req.onsuccess = () => {
            if (req.result) {
                visitor(req.result.value);
                req.result.continue();
            }
        };
    });
};
/**
 *
 * @param db
 * @param collection
 * @param index
 * @param visitor
 * @param query
 * @param direction
 */
const dbApplyIndexVisitor = (db, collection, index, visitor, query, direction) => {
    return dbOpenIndexCursor(db, collection, index, query, direction).then((req) => {
        req.onsuccess = () => {
            if (req.result) {
                visitor(req.result.value);
                req.result.continue();
            }
        };
    });
};
/**
 * Performs a database upbrade based on a defined schema.
 * Old object stores are all deleted if not present on the schema.
 * Collections and their indexes defined on the schema are created.
 *
 * @param db
 * @param schema
 */
const dbUpgrade = (db, schema) => {
    for (const name of db.objectStoreNames)
        db.deleteObjectStore(name);
    schema.collections.forEach((col) => {
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
/**
 * Opens an indexed db with a given schema;
 *
 * @param schema
 */
const dbOpen = (schema) => new Promise((resolve, reject) => {
    const req = indexedDB.open(schema.name, schema.version);
    req.onupgradeneeded = () => dbUpgrade(req.result, schema);
    req.onerror = () => reject(req.error);
    req.onblocked = () => reject(new Error("The database is blocked. You should probably refresh your browser."));
    req.onsuccess = () => resolve(req.result);
});
/**
 * This class implements an IndexedDB Select statement.
 * It is able to filter the results using the where clause.
 * It needs an index for the initial order by. Subsequent order by clauses are executed
 * on the resulting array.
 *
 * @author Rodrigo Portela
 */
class ClientDbSelect extends Db_1.DbSelect {
    constructor(db, schema) {
        super();
        this.db = db;
        this.schema = schema;
    }
    _createCursorRequest() {
        return this.db.then((db) => {
            const os = db.transaction(this.schema.name).objectStore(this.schema.name);
            if (this._order) {
                if (this._order.descending) {
                    return os.index(this._order.name).openCursor(null, "prev");
                }
                else {
                    return os.index(this._order.name).openCursor();
                }
            }
            else
                return os.openCursor();
        });
    }
    first() {
        return this._createCursorRequest().then((request) => new Promise((resolve, reject) => {
            request.onsuccess = () => resolve(request.result.value);
            request.onerror = () => reject(request.error);
        }));
    }
    toArray() {
        return this._createCursorRequest().then((request) => new Promise((resolve, reject) => {
            const list = [];
            let position = 0;
            let counter = 0;
            request.onsuccess = () => {
                if (request.result) {
                    if (position >= this._offset) {
                        if (this._where.filterRecord(request.result.value)) {
                            list.push(request.result.value);
                            counter++;
                        }
                    }
                    if (this._limit === 0 || counter < this._limit) {
                        position++;
                        request.result.continue();
                    }
                    else {
                        resolve(list);
                    }
                }
                else {
                    if (this._order && this._order.next) {
                        this._order.next.sort(list);
                    }
                    resolve(list);
                }
            };
            request.onerror = () => reject(request.error);
        }));
    }
}
exports.ClientDbSelect = ClientDbSelect;
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
            dbUpgrade(db, this.schema);
            this.listeners.dispatch(Db_1.DbEvent.UPGRADED, this);
        };
        this.schema = schema;
        this.listeners = {};
        for (const col of schema.collections) {
            this.listeners[col.name] = new Dispatcher_1.default();
        }
        this.opening = new Promise((resolve, reject) => {
            const req = indexedDB.open(schema.name, schema.version);
            req.onsuccess = () => {
                resolve(req.result);
            };
            req.onerror = () => reject(req.error);
            req.onupgradeneeded = this._upgrade;
            req.onblocked = () => reject(new Error("Blocked, you should probably refresh your browser"));
        });
    }
    getSchema() {
        return this.schema;
    }
    getCollectionSchema(collection) {
        return this.schema.collections.find((col) => col.name === collection);
    }
    select(collection) {
        const colSchema = this.getCollectionSchema(collection);
        if (!colSchema) {
            throw new Error("Collection schema not found: " + collection);
        }
        else {
            return new ClientDbSelect(this.opening, colSchema);
        }
    }
    insert(collection, record) {
        return this.opening.then((db) => new Promise((resolve, reject) => {
            const req = db
                .transaction(collection, "readwrite")
                .objectStore(collection)
                .add(record);
            req.onerror = () => reject(req.error);
            req.onsuccess = () => {
                this.notifyListener(collection, Db_1.DbEvent.INSERTED, record);
                resolve(record);
            };
        }));
    }
    update(collection, record) {
        return this.opening.then((db) => new Promise((resolve, reject) => {
            const req = db
                .transaction(collection, "readwrite")
                .objectStore(collection)
                .put(record);
            req.onerror = () => reject(req.error);
            req.onsuccess = () => {
                this.notifyListener(collection, Db_1.DbEvent.UPDATED, record);
                resolve(record);
            };
        }));
    }
    /**
     *
     * @param collection
     * @param id
     */
    delete(collection, id) {
        return this.opening.then((db) => new Promise((resolve, reject) => {
            const req = db
                .transaction(collection, "readwrite")
                .objectStore(collection)
                .delete(id);
            req.onerror = () => reject(req.error);
            req.onsuccess = () => {
                this.notifyListener(collection, Db_1.DbEvent.DELETED, id);
                resolve(id);
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
exports.ClientDb = ClientDb;
