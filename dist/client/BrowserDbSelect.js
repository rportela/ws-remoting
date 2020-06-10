"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const DbSelect_1 = require("../common/DbSelect");
class BrowserDbSelect extends DbSelect_1.DbSelect {
    constructor(db, collection) {
        super(collection);
        this.db = db;
    }
    getRecords() {
        const recs = [];
        return this.applyFilter(recs.push).then(() => recs);
    }
    applyFilter(fn) {
        return this.db.forEach(this._from, (cursor) => {
            if (!this._where || this._where.filterRecord(cursor.value))
                fn(cursor.value);
            cursor.continue();
        });
    }
    count() {
        let counter = 0;
        return this.applyFilter(() => counter++).then(() => counter);
    }
    first() {
        return this.all().then((recs) => recs && recs.length > 0 ? recs[0] : undefined);
    }
    all() {
        return this.getRecords().then((recs) => {
            if (this._orderBy)
                this._orderBy.sort(recs);
            if (this._offset) {
                if (this._limit)
                    return recs.slice(this._offset, this._limit);
                else
                    return recs.slice(this._offset);
            }
            else if (this._limit) {
                return recs.slice(0, this._limit);
            }
            else {
                return recs;
            }
        });
    }
    forEach(fn) {
        return this.all().then((recs) => recs.forEach(fn));
    }
}
exports.default = BrowserDbSelect;
