/**
 *
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
 *
 */
export enum DbFilterOperation {
  AND,
  OR,
}

/**
 *
 */
export enum DbFilterType {
  TERM,
  NODE,
  EXPRESSION,
}

/**
 *
 */
export interface DbFilter {
  filterType(): DbFilterType;
  filterRecord(record: any): boolean;
}

/**
 *
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
 *
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
 * This represents a filter expresison.
 */
export class DbFilterExpression implements DbFilter {
  first: DbFilterNode;
  last: DbFilterNode;
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

export class DbOrderBy {
  name: string;
  descending: boolean;
  next: DbOrderBy;

  constructor(name: string, descending: boolean = false) {
    this.name = name;
    this.descending = descending;
  }

  createComparer() {
    return this.descending
      ? (a, b) => a[this.name] - b[this.name]
      : (a, b) => b[this.name] - a[this.name];
  }
  sort(arr: any[]) {
    arr.sort(this.createComparer());
    if (this.next) {
      this.next.sort(arr);
    }
  }
}

/**
 *
 */
export abstract class DbSelect<T> {
  _where: DbFilterExpression;
  _order: DbOrderBy;
  _offset: number;
  _limit: number;

  where(filter: DbFilter): DbSelect<T> {
    this._where = new DbFilterExpression(filter);
    return this;
  }

  and(filter: DbFilter): DbSelect<T> {
    if (this._where) {
      this._where.and(filter);
    } else {
      this._where = new DbFilterExpression(filter);
    }
    return this;
  }

  or(filter: DbFilter): DbSelect<T> {
    if (this._where) {
      this._where.or(filter);
    } else {
      this._where = new DbFilterExpression(filter);
    }
    return this;
  }

  offset(offset: number): DbSelect<T> {
    this._offset = offset;
    return this;
  }

  limit(limit: number): DbSelect<T> {
    this._limit = limit;
    return this;
  }

  orderBy(name: string, descending: boolean = false): DbSelect<T> {
    this._order = new DbOrderBy(name, descending);
    return this;
  }

  thenOrderBy(name: string, descending: boolean = false): DbSelect<T> {
    this._order.next = new DbOrderBy(name, descending);
    return this;
  }

  abstract first(): Promise<T>;
  abstract toArray(): Promise<T[]>;
}

export type DbKey = string | number;

export interface DbSchemaIndex {
  name: string;
  unique?: boolean;
}

export interface DbSchemaCollection {
  name: string;
  keyPath?: string;
  autoIncrement?: boolean;
  indexes?: DbSchemaIndex[];
}

export interface DbSchema {
  version: number;
  name: string;
  collections: DbSchemaCollection[];
}

export enum DbEvent {
  INSERTED = "INSERTED",
  UPDATED = "UPDATED",
  DELETED = "DELETED",
  UPGRADED = "UPGRADED",
}

export class DbSaveEvent {
  db: string;
  collection: string;
  keyPath: string;
  key: DbKey;
  record: any;
}

export class DbDeleteEvent {
  db: string;
  collection: string;
  keyPath: string;
  key: DbKey;
}

export interface Db {
  getSchema(): DbSchema;
  getCollectionSchema(collection: string): DbSchemaCollection;
  select<T>(collection: string): DbSelect<T>;
  insert<T>(collection: string, record: T): Promise<DbSaveEvent>;
  update<T>(collection: string, record: T): Promise<DbSaveEvent>;
  upsert<T>(collection: string, record: T): Promise<DbSaveEvent>;
  delete(collection: string, id: DbKey): Promise<DbDeleteEvent>;
}
