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
        return new NaiveDbSelect(this, collection);
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
    count() {
        throw new Error("Method not implemented.");
    }
    first() {
        throw new Error("Method not implemented.");
    }
    all() {
        throw new Error("Method not implemented.");
    }
    forEach(fn) {
        throw new Error("Method not implemented.");
    }
}
exports.MemoryDbSelect = MemoryDbSelect;
