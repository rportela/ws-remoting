/**
 * The standard database filter comparsion.
 * @author Rodrigo Portela
 */
export enum DbFilterComparison {
  EQUALS_TO,
  NOT_EQUALS_TO,
  GREATER_THAN,
  GRATER_OR_EQUAL,
  LOWER_THAN,
  LOWER_OR_EQUAL,
  IN,
  NOT_IN,
  LIKE,
  NOT_LIKE,
}

/**
 * The filter join operation. Either an AND or an OR.
 */
export enum DbFilterOperation {
  AND,
  OR,
}

/**
 * The type of filter that a filter class should have.
 */
export enum DbFilterType {
  TERM,
  NODE,
  EXPRESSION,
}

/**
 * An interface for a database query filter.
 */
export interface DbFilter {
  filterType(): DbFilterType;
  filterRecord(record: any): boolean;
}

/**
 * A database filter term.
 */
export class DbFilterTerm implements DbFilter {
  name: string;
  comparison: DbFilterComparison;
  value: any;

  constructor(name: string, comparison: DbFilterComparison, value: any) {
    this.name = name;
    this.comparison = comparison;
    this.value = value;
  }
  filterRecord(record: any): boolean {
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
  filterType(): DbFilterType {
    return DbFilterType.TERM;
  }
}

/**
 * A database filter expression node.
 */
export class DbFilterNode implements DbFilter {
  filter: DbFilter;
  operation?: DbFilterOperation;
  next?: DbFilterNode;
  constructor(filter: DbFilter) {
    this.filter = filter;
  }
  filterRecord(record: any): boolean {
    if (this.next) {
      switch (this.operation) {
        case DbFilterOperation.AND:
          return (
            this.filter.filterRecord(record) && this.next.filterRecord(record)
          );
        case DbFilterOperation.OR:
          return (
            this.filter.filterRecord(record) || this.next.filterRecord(record)
          );
        default:
          throw new Error("Unknown DbFilterOperation " + this.operation);
      }
    }
  }
  filterType(): DbFilterType {
    return DbFilterType.NODE;
  }
}
/**
 * A database filter expression.
 */
export class DbFilterExpression implements DbFilter {
  first: DbFilterNode;
  private last: DbFilterNode;
  constructor(filter: DbFilter) {
    this.first = new DbFilterNode(filter);
    this.last = this.first;
  }

  filterRecord(record: any): boolean {
    return this.first.filterRecord(record);
  }
  filterType(): DbFilterType {
    return DbFilterType.EXPRESSION;
  }

  and(filter: DbFilter): DbFilterExpression {
    this.last.operation = DbFilterOperation.AND;
    this.last.next = new DbFilterNode(filter);
    this.last = this.last.next;
    return this;
  }

  or(filter: DbFilter): DbFilterExpression {
    this.last.operation = DbFilterOperation.OR;
    this.last.next = new DbFilterNode(filter);
    this.last = this.last.next;
    return this;
  }
}
