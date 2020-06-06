"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * The standard database filter comparsion.
 * @author Rodrigo Portela
 */
var DbFilterComparison;
(function (DbFilterComparison) {
    DbFilterComparison[DbFilterComparison["EQUALS_TO"] = 0] = "EQUALS_TO";
    DbFilterComparison[DbFilterComparison["NOT_EQUALS_TO"] = 1] = "NOT_EQUALS_TO";
    DbFilterComparison[DbFilterComparison["GREATER_THAN"] = 2] = "GREATER_THAN";
    DbFilterComparison[DbFilterComparison["GRATER_OR_EQUAL"] = 3] = "GRATER_OR_EQUAL";
    DbFilterComparison[DbFilterComparison["LOWER_THAN"] = 4] = "LOWER_THAN";
    DbFilterComparison[DbFilterComparison["LOWER_OR_EQUAL"] = 5] = "LOWER_OR_EQUAL";
    DbFilterComparison[DbFilterComparison["IN"] = 6] = "IN";
    DbFilterComparison[DbFilterComparison["NOT_IN"] = 7] = "NOT_IN";
    DbFilterComparison[DbFilterComparison["LIKE"] = 8] = "LIKE";
    DbFilterComparison[DbFilterComparison["NOT_LIKE"] = 9] = "NOT_LIKE";
})(DbFilterComparison = exports.DbFilterComparison || (exports.DbFilterComparison = {}));
/**
 * The filter join operation. Either an AND or an OR.
 */
var DbFilterOperation;
(function (DbFilterOperation) {
    DbFilterOperation[DbFilterOperation["AND"] = 0] = "AND";
    DbFilterOperation[DbFilterOperation["OR"] = 1] = "OR";
})(DbFilterOperation = exports.DbFilterOperation || (exports.DbFilterOperation = {}));
/**
 * The type of filter that a filter class should have.
 */
var DbFilterType;
(function (DbFilterType) {
    DbFilterType[DbFilterType["TERM"] = 0] = "TERM";
    DbFilterType[DbFilterType["NODE"] = 1] = "NODE";
    DbFilterType[DbFilterType["EXPRESSION"] = 2] = "EXPRESSION";
})(DbFilterType = exports.DbFilterType || (exports.DbFilterType = {}));
/**
 * A database filter term.
 */
class DbFilterTerm {
    constructor(name, comparison, value) {
        this.name = name;
        this.comparison = comparison;
        this.value = value;
    }
    filterRecord(record) {
        switch (this.comparison) {
            case DbFilterComparison.EQUALS_TO:
                return record[this.name] === this.value;
            case DbFilterComparison.GRATER_OR_EQUAL:
                return record[this.name] >= this.value;
            case DbFilterComparison.GREATER_THAN:
                return record[this.name] > this.value;
            case DbFilterComparison.IN:
                return this.value.indexOf(record[this.name]) >= 0;
            case DbFilterComparison.LIKE:
                return this.value.exec(record[this.name]) ? true : false;
            case DbFilterComparison.LOWER_OR_EQUAL:
                return record[this.name] <= this.value;
            case DbFilterComparison.LOWER_THAN:
                return record[this.name] < this.value;
            case DbFilterComparison.NOT_EQUALS_TO:
                return record[this.name] !== this.value;
            case DbFilterComparison.NOT_IN:
                return this.value.indexOf(record[this.name]) < 0;
            case DbFilterComparison.NOT_LIKE:
                return this.value.exec(record[this.name]) ? false : true;
            default:
                throw new Error("Unknown DbRecordComparison " + this.comparison);
        }
    }
    filterType() {
        return DbFilterType.TERM;
    }
}
exports.DbFilterTerm = DbFilterTerm;
/**
 * A database filter expression node.
 */
class DbFilterNode {
    constructor(filter) {
        this.filter = filter;
    }
    filterRecord(record) {
        if (this.next) {
            switch (this.operation) {
                case DbFilterOperation.AND:
                    return (this.filter.filterRecord(record) && this.next.filterRecord(record));
                case DbFilterOperation.OR:
                    return (this.filter.filterRecord(record) || this.next.filterRecord(record));
                default:
                    throw new Error("Unknown DbFilterOperation " + this.operation);
            }
        }
    }
    filterType() {
        return DbFilterType.NODE;
    }
}
exports.DbFilterNode = DbFilterNode;
/**
 * A database filter expression.
 */
class DbFilterExpression {
    constructor(filter) {
        this.first = new DbFilterNode(filter);
        this.last = this.first;
    }
    filterRecord(record) {
        return this.first.filterRecord(record);
    }
    filterType() {
        return DbFilterType.EXPRESSION;
    }
    and(filter) {
        this.last.operation = DbFilterOperation.AND;
        this.last.next = new DbFilterNode(filter);
        this.last = this.last.next;
        return this;
    }
    or(filter) {
        this.last.operation = DbFilterOperation.OR;
        this.last.next = new DbFilterNode(filter);
        this.last = this.last.next;
        return this;
    }
}
exports.DbFilterExpression = DbFilterExpression;
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
            if (this._where.filterType() === DbFilterType.EXPRESSION) {
                const exp = this._where;
                exp.or(filter);
            }
            else {
                const exp = new DbFilterExpression(filter);
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
            if (this._where.filterType() === DbFilterType.EXPRESSION) {
                const exp = this._where;
                exp.and(filter);
            }
            else {
                const exp = new DbFilterExpression(filter);
                this._where = exp.and(filter);
            }
        }
        else {
            this._where = filter;
        }
        return this;
    }
    orderBy(name, descending) {
        this._orderBy = new DbOrderBy(name, descending);
        return this;
    }
    thenOrderBy(name, descending) {
        if (this._orderBy) {
            let ob = this._orderBy;
            while (ob.next)
                ob = ob.next;
            ob.next = new DbOrderBy(name, descending);
        }
        else {
            this._orderBy = new DbOrderBy(name, descending);
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
class NaiveDbSelect extends DbSelect {
    constructor(db, collection) {
        super(collection);
        this.db = db;
    }
    count() {
        return this.db.all(this._from).then((records) => {
            if (!this._where)
                return records.length;
            else {
                let counter = 0;
                for (const r of records)
                    if (this._where.filterRecord(r))
                        counter++;
                return counter;
            }
        });
    }
    first() {
        return this.db.all(this._from).then((records) => {
            if (this._where)
                records = records.filter(this._where.filterRecord);
            if (this._orderBy)
                this._orderBy.sort(records);
            return records.length > 0 ? records[0] : null;
        });
    }
    all() {
        return this.db.all(this._from).then((records) => {
            if (this._where)
                records = records.filter(this._where.filterRecord);
            if (this._orderBy)
                this._orderBy.sort(records);
            if (this._offset) {
                return records.slice(this._offset, this._limit || records.length);
            }
            else if (this._limit) {
                return records.slice(0, this._limit);
            }
            else {
                return records;
            }
        });
    }
}
exports.NaiveDbSelect = NaiveDbSelect;
var DbEventType;
(function (DbEventType) {
    DbEventType["ADD"] = "DB_RECORD_ADD";
    DbEventType["PUT"] = "DB_RECORD_PUT";
    DbEventType["DELETE"] = "DB_RECORD_DELETE";
    DbEventType["DROP_COLLECTION"] = "DB_COLLECTION_DROP";
    DbEventType["DROP_DATABASE"] = "DB_DATABASE_DROP";
    DbEventType["UPGRADED"] = "DB_UPGRADED";
    DbEventType["OPEN"] = "DB_OPEN";
    DbEventType["CLOSED"] = "DB_CLOSED";
    DbEventType["ERROR"] = "ERROR";
})(DbEventType = exports.DbEventType || (exports.DbEventType = {}));
function isDbRecordSaveEvent(event) {
    return event && event.record !== undefined;
}
exports.isDbRecordSaveEvent = isDbRecordSaveEvent;
function isDbRecordDeleteEvent(event) {
    return event && event.key !== undefined;
}
exports.isDbRecordDeleteEvent = isDbRecordDeleteEvent;
