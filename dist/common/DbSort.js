"use strict";
/**
 * Wraps a sequence of order by expressions where you can define
 * a column name and a direction for the sort.
 * @author Rodrigo Portela
 */
Object.defineProperty(exports, "__esModule", { value: true });
class DbOrderBy {
    constructor(getter, descending = false) {
        this.getter =
            typeof getter === "string" ? (record) => record[getter] : getter;
        this.descending = descending;
    }
    createComparer() {
        return this.descending
            ? (a, b) => {
                const x = this.getter(b);
                const y = this.getter(a);
                return x === y ? 0 : x > y ? 1 : -1;
            }
            : (a, b) => {
                const x = this.getter(a);
                const y = this.getter(b);
                return x === y ? 0 : x > y ? 1 : -1;
            };
    }
    sort(arr) {
        arr.sort(this.createComparer());
        if (this.next) {
            this.next.sort(arr);
        }
    }
}
exports.DbOrderBy = DbOrderBy;
