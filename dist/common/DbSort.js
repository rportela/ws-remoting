"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Wraps a sequence of order by expressions where you can define
 * a column name and a direction for the sort.
 * @author Rodrigo Portela
 */
class DbOrderBy {
    constructor(name, descending = false) {
        this.name = name;
        this.descending = descending;
    }
    createComparer() {
        return this.descending
            ? (a, b) => a[this.name] - b[this.name]
            : (a, b) => b[this.name] - a[this.name];
    }
    sort(arr) {
        arr.sort(this.createComparer());
        if (this.next) {
            this.next.sort(arr);
        }
    }
}
exports.DbOrderBy = DbOrderBy;
