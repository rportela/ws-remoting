"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const EventEmitter_1 = require("../common/EventEmitter");
const BrowserDb_1 = require("./BrowserDb");
const DbEvents_1 = require("../common/DbEvents");
class ObservableDb {
    constructor(schema) {
        this.emitter = new EventEmitter_1.default();
        this.db = new BrowserDb_1.default(schema);
    }
    /**
     * Gets the current IDBDatabase promise for avanced programming.
     */
    getDb() {
        return this.db.getDb();
    }
    /**
     * The schema of this database.
     */
    getSchema() {
        return this.db.getSchema();
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
        return this.db
            .add(collection, record)
            .then((event) => this.emitter.emit(DbEvents_1.DbEventType.ADD, event));
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
        return this.db
            .put(collection, record)
            .then((event) => this.emitter.emit(DbEvents_1.DbEventType.PUT, event));
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
        return this.db
            .delete(collection, key)
            .then((event) => this.emitter.emit(DbEvents_1.DbEventType.DELETE, event));
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
        return this.db
            .clear(collection)
            .then((event) => this.emitter.emit(DbEvents_1.DbEventType.CLEAR, event));
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
        return this.db.count(collection, key);
    }
    /**
     * Retrieves the value of the first record matching the given key or key range in query.
     * If successful, request's result will be the value, or undefined if there was no matching record.
     *
     * @param collection
     * @param query
     */
    get(collection, query) {
        return this.db.get(collection, query);
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
        return this.db.getAll(collection, query, count);
    }
    /**
     * Retrieves the keys of records matching the given key or key range in query (up to count if given).
     * If successful, request's result will be an Array of the keys.
     * @param collection
     * @param query
     * @param count
     */
    getAllKeys(collection, query, count) {
        return this.db.getAllKeys(collection, query);
    }
    /**
     * Opens a cursor over the records matching query, ordered by direction. If query is null, all records in store are matched.
     * If successful, request's result will be an IDBCursorWithValue pointing at the first matching record, or null if there were no matching records.
     *
     * @param collection
     */
    forEach(collection, fn, query, direction) {
        return this.db.forEach(collection, fn, query, direction);
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
        return this.db.forEachKey(collection, fn, query, direction);
    }
    on(event, listener) {
        this.emitter.on(event, listener);
    }
    off(event, listener) {
        this.emitter.off(event, listener);
    }
    select(collection) {
        return this.db.select(collection);
    }
}
exports.default = ObservableDb;
