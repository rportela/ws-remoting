"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Db_1 = require("../common/Db");
const BrowserDb_1 = require("./BrowserDb");
const Dispatcher_1 = require("../common/Dispatcher");
class ObservableDbSelect extends Db_1.DbSelect {
    constructor(db, collection) {
        super();
        this.db = db;
        this.collection = collection;
    }
    first() {
        return this.db.first(this.collection, this._where, this._order);
    }
    toArray() {
        return this.db.query(this.collection, this._where, this._order, this._offset, this._limit);
    }
}
exports.ObservableDbSelect = ObservableDbSelect;
class ObservableDb {
    constructor(schema) {
        this.db = new BrowserDb_1.default(schema);
        this.listeners = {};
        schema.collections.forEach((col) => (this.listeners[col.name] = new Dispatcher_1.default()));
    }
    createId() {
        return new Date().getTime().toString(36) + "_" + Math.random().toString(36);
    }
    /**
     *
     * @param collection
     * @param action
     * @param params
     */
    notifyListeners(collection, action, params) {
        const listener = this.listeners[collection];
        if (listener)
            listener.dispatch(action, params);
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
     */
    getCollectionSchema(collection) {
        return this.db.getSchema().collections.find((c) => c.name === collection);
    }
    /**
     *
     * @param collection
     */
    getCollectionKeyPath(collection) {
        const colSchema = this.getCollectionSchema(collection);
        return colSchema ? colSchema.keyPath : null;
    }
    /**
     *
     * @param collection
     */
    select(collection) {
        return new ObservableDbSelect(this.db, collection);
    }
    /**
     *
     * @param collection
     * @param record
     */
    insert(collection, record) {
        const event = {
            db: this.getSchema().name,
            collection: collection,
            keyPath: this.getCollectionKeyPath(collection),
            key: this.createId(),
            record: record,
        };
        record[event.keyPath] = event.key;
        record["created_at"] = new Date();
        record["updated_at"] = new Date();
        return this.db.add(collection, record).then(() => {
            this.notifyListeners(collection, Db_1.DbEvent.INSERTED, event);
            return event;
        });
    }
    /**
     *
     * @param collection
     * @param record
     */
    update(collection, record) {
        const keyPath = this.getCollectionKeyPath(collection);
        const event = {
            db: this.getSchema().name,
            collection: collection,
            keyPath: keyPath,
            key: record[keyPath],
            record: record,
        };
        record["updated_at"] = new Date();
        return this.db.put(collection, record).then(() => {
            this.notifyListeners(collection, Db_1.DbEvent.UPDATED, event);
            return event;
        });
    }
    /**
     *
     * @param collection
     * @param record
     */
    upsert(collection, record) {
        const key = record[this.getCollectionKeyPath(collection)];
        return this.db
            .get(collection, key)
            .then((old) => old ? this.update(collection, record) : this.insert(collection, record));
    }
    /**
     *
     * @param collection
     * @param id
     */
    delete(collection, id) {
        const event = {
            db: this.getSchema().name,
            collection: collection,
            keyPath: this.getCollectionKeyPath(collection),
            key: id,
        };
        return this.db.delete(collection, id).then(() => {
            this.notifyListeners(collection, Db_1.DbEvent.DELETED, event);
            return event;
        });
    }
    addListener(collection, key, listener) {
        const dispacher = this.listeners[collection];
        if (!dispacher)
            throw new Error("Couldn't find an event dispatcher for collection: " + collection);
        else {
            dispacher.register(key, listener);
        }
    }
    removeListener(collection, key, listener) {
        const dispatcher = this.listeners[collection];
        if (dispatcher)
            dispatcher.unregister(key, listener);
    }
}
exports.ObservableDb = ObservableDb;
