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
            ? (a, b) => {
                const x = b[this.name];
                const y = a[this.name];
                return x === y ? 0 : x > y ? 1 : -1;
            }
            : (a, b) => {
                const x = a[this.name];
                const y = b[this.name];
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
