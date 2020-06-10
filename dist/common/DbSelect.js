"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const DbFilters_1 = require("./DbFilters");
const DbSort_1 = require("./DbSort");
/**
 * Interfaces a database select with configurable where clause,
 * orderBy clause, offset number and a limit of records.
 * @author Rodrigo Portela
 */
class DbSelect {
    constructor(from) {
        this._from = from;
    }
    where(filter) {
        this._where = filter;
        return this;
    }
    orWhere(filter) {
        if (this._where) {
            if (this._where.filterType() === DbFilters_1.DbFilterType.EXPRESSION) {
                const exp = this._where;
                exp.or(filter);
            }
            else {
                const exp = new DbFilters_1.DbFilterExpression(filter);
                this._where = exp.or(filter);
            }
        }
        else {
            this._where = filter;
        }
        return this;
    }
    andWhere(filter) {
        if (this._where) {
            if (this._where.filterType() === DbFilters_1.DbFilterType.EXPRESSION) {
                const exp = this._where;
                exp.and(filter);
            }
            else {
                const exp = new DbFilters_1.DbFilterExpression(filter);
                this._where = exp.and(filter);
            }
        }
        else {
            this._where = filter;
        }
        return this;
    }
    orderBy(name, descending) {
        this._orderBy = new DbSort_1.DbOrderBy(name, descending);
        return this;
    }
    thenOrderBy(name, descending) {
        if (this._orderBy) {
            let ob = this._orderBy;
            while (ob.next)
                ob = ob.next;
            ob.next = new DbSort_1.DbOrderBy(name, descending);
        }
        else {
            this._orderBy = new DbSort_1.DbOrderBy(name, descending);
        }
        return this;
    }
    offset(count) {
        this._offset = count;
        return this;
    }
    limit(count) {
        this._limit = count;
        return this;
    }
    page(page, pageSize) {
        this._offset = pageSize * page;
        this._limit = pageSize;
        return this;
    }
}
exports.DbSelect = DbSelect;
