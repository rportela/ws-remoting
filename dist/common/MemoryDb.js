"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const DbSelect_1 = require("./DbSelect");
class MemoryDb {
    constructor(schema) {
        this.schema = schema;
        this.records = {};
        for (let col of schema.collections) {
            this.records[col.name] = [];
        }
    }
    getSchema() {
        return this.schema;
    }
    get(collection, key) {
        const col = this.schema.collections.find((c) => c.name === collection);
        return col
            ? this.records[col.name].find((r) => r[col.keyPath.toString()] === key)
            : null;
    }
    getAll(collection) {
        return Promise.resolve(this.records[collection]);
    }
    select(collection) {
        return new MemoryDbSelect(this, collection);
    }
    add(collection, record) {
        this.records[collection].push(record);
        return Promise.resolve(this.records.length);
    }
    put(collection, record) {
        const col = this.schema.collections.find((c) => c.name === collection);
        const oldindex = col
            ? this.records[col.name].findIndex((r) => r[col.keyPath.toString()] === record[col.keyPath.toString()])
            : -1;
        if (oldindex >= 0) {
            this.records[col.name][oldindex] = record;
            return Promise.resolve(oldindex);
        }
        else
            return this.add(collection, record);
    }
    delete(collection, key) {
        throw new Error("Method not implemented.");
    }
    clear(collection) {
        this.records[collection] = {};
        return Promise.resolve({
            db: this.schema.name,
            collection: collection,
        });
    }
    drop() {
        for (const col of this.schema.collections)
            delete this.records[col.name];
        return Promise.resolve({
            db: this.schema.name,
        });
    }
}
exports.MemoryDb = MemoryDb;
class MemoryDbSelect extends DbSelect_1.DbSelect {
    constructor(db, collection) {
        super(collection);
        this.db = db;
    }
    count() {
        return this.all().then((arr) => arr.length);
    }
    first() {
        return this.all().then((arr) => (arr.length > 0 ? arr[0] : undefined));
    }
    all() {
        return this.db.getAll(this._from).then((recs) => {
            if (this._where)
                recs = recs.filter(this._where.filterRecord);
            if (recs.length === 0)
                return recs;
            if (this._orderBy)
                this._orderBy.sort(recs);
            const start = this._offset || 0;
            const end = Math.min(this._offset + this._limit, recs.length);
            if (start) {
                return end ? recs.slice(start, end) : recs.slice(start, recs.length);
            }
            else if (end) {
                return recs.slice(0, end);
            }
            else
                return recs;
        });
    }
    forEach(fn) {
        return this.all().then((recs) => recs.forEach(fn));
    }
}
exports.MemoryDbSelect = MemoryDbSelect;
