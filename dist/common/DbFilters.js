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
