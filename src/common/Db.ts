/**
 * Currently available database key types.
 *  * @author Rodrigo Portela.
 */
export type DbKey = string | number;
/**
 * This interface wraps options for creating an index on the database.
 * @author Rodrigo Portela
 */
export interface DbSchemaIndex {
  /**
   * The name of the index.
   */
  name: string;
  /**
   * The key path of the index to be created.
   */
  keyPath: string | string[];
  /**
   * An indicator that the index is unique.
   */
  unique?: boolean;
}

/**
 * This interface wraps options for creating a collection on the database.
 * @author Rodrigo Portela
 */
export interface DbSchemaCollection {
  /**
   * The name of the collection or object store.
   */
  name: string;
  /**
   * The key path to locate objects.
   */
  keyPath?: string | string[];
  /**
   * An indicator that the key Path should auto Increment itself.
   */
  autoIncrement?: boolean;
  /**
   * None or more indexes to be created on the object store.
   */
  indexes?: DbSchemaIndex[];
}

/**
 * This is the definition of the schema of the database.
 * It can either be declared on json or read from a real database instance.
 */
export interface DbSchema {
  /**
   * The name of the database.
   */
  name: string;
  /**
   * The version number of the schema or 1 if none is provided.
   */
  version?: number;
  /**
   * An array of collections that should be created on the database.
   */
  collections: DbSchemaCollection[];
}

/**
 * This interface is utilized on cursors.
 * The Record Processor should visit a record and return true if it wants more records
 * or false otherwise.
 * @author Rodrigo Portela
 */
export interface DbRecordProcessor {
  visit(record: any): boolean;
}

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
  private first: DbFilterNode;
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

/**
 * Wraps a sequence of order by expressions where you can define
 * a column name and a direction for the sort.
 * @author Rodrigo Portela
 */
export class DbOrderBy {
  name: string;
  descending: boolean;
  next?: DbOrderBy;

  constructor(name: string, descending: boolean = false) {
    this.name = name;
    this.descending = descending;
  }

  createComparer() {
    return this.descending
      ? (a: any, b: any) => a[this.name] - b[this.name]
      : (a: any, b: any) => b[this.name] - a[this.name];
  }
  sort(arr: any[]) {
    arr.sort(this.createComparer());
    if (this.next) {
      this.next.sort(arr);
    }
  }
}

/**
 * Interfaces a database select with configurable where clause,
 * orderBy clause, offset number and a limit of records.
 * @author Rodrigo Portela
 */
export abstract class DbSelect<T> {
  _from: string;
  _where: DbFilter;
  _orderBy: DbOrderBy;
  _offset: number;
  _limit: number;
  constructor(from: string) {
    this._from = from;
  }
  where(filter: DbFilterTerm | DbFilterExpression): DbSelect<T> {
    this._where = filter;
    return this;
  }
  orWhere(filter: DbFilterTerm | DbFilterExpression): DbSelect<T> {
    if (this._where) {
      if (this._where.filterType() === DbFilterType.EXPRESSION) {
        const exp: any = this._where;
        exp.or(filter);
      } else {
        const exp: DbFilterExpression = new DbFilterExpression(filter);
        this._where = exp.or(filter);
      }
    } else {
      this._where = filter;
    }
    return this;
  }
  andWhere(filter: DbFilterTerm | DbFilterExpression): DbSelect<T> {
    if (this._where) {
      if (this._where.filterType() === DbFilterType.EXPRESSION) {
        const exp: any = this._where;
        exp.and(filter);
      } else {
        const exp: DbFilterExpression = new DbFilterExpression(filter);
        this._where = exp.and(filter);
      }
    } else {
      this._where = filter;
    }
    return this;
  }
  orderBy(name: string, descending?: boolean): DbSelect<T> {
    this._orderBy = new DbOrderBy(name, descending);
    return this;
  }
  thenOrderBy(name: string, descending?: boolean): DbSelect<T> {
    if (this._orderBy) {
      let ob = this._orderBy;
      while (ob.next) ob = ob.next;
      ob.next = new DbOrderBy(name, descending);
    } else {
      this._orderBy = new DbOrderBy(name, descending);
    }
    return this;
  }
  offset(count: number): DbSelect<T> {
    this._offset = count;
    return this;
  }
  limit(count: number): DbSelect<T> {
    this._limit = count;
    return this;
  }
  page(page: number, pageSize: number): DbSelect<T> {
    this._offset = pageSize * page;
    this._limit = pageSize;
    return this;
  }
  abstract count(): Promise<number>;
  abstract first(): Promise<T>;
  abstract all(): Promise<T[]>;
}

export interface Db {
  getSchema(): DbSchema;
  get(collection: string, key: DbKey): Promise<any>;
  all(collection: string): Promise<any[]>;
  select<T>(collection: string): DbSelect<T>;
  add(collection: string, record: any): Promise<DbRecordSaveEvent>;
  put(collection: string, record: any): Promise<DbRecordSaveEvent>;
  delete(
    collection: string,
    key: string | number
  ): Promise<DbRecordDeleteEvent>;
  dropCollection(collection: string): Promise<DbCollectionDropEvent>;
  drop(): Promise<DbDatabaseDropEvent>;
}

export class NaiveDbSelect<T> extends DbSelect<T> {
  db: Db;
  constructor(db: Db, collection: string) {
    super(collection);
    this.db = db;
  }

  count(): Promise<number> {
    return this.db.all(this._from).then((records) => {
      if (!this._where) return records.length;
      else {
        let counter = 0;
        for (const r of records) if (this._where.filterRecord(r)) counter++;
        return counter;
      }
    });
  }
  first(): Promise<T> {
    return this.db.all(this._from).then((records: T[]) => {
      if (this._where) records = records.filter(this._where.filterRecord);
      if (this._orderBy) this._orderBy.sort(records);
      return records.length > 0 ? records[0] : null;
    });
  }
  all(): Promise<T[]> {
    return this.db.all(this._from).then((records: T[]) => {
      if (this._where) records = records.filter(this._where.filterRecord);
      if (this._orderBy) this._orderBy.sort(records);
      if (this._offset) {
        return records.slice(this._offset, this._limit || records.length);
      } else if (this._limit) {
        return records.slice(0, this._limit);
      } else {
        return records;
      }
    });
  }
}

export enum DbEventType {
  ADD = "DB_RECORD_ADD",
  PUT = "DB_RECORD_PUT",
  DELETE = "DB_RECORD_DELETE",
  DROP_COLLECTION = "DB_COLLECTION_DROP",
  DROP_DATABASE = "DB_DATABASE_DROP",
  UPGRADED = "DB_UPGRADED",
  OPEN = "DB_OPEN",
  CLOSED = "DB_CLOSED",
  ERROR = "ERROR",
}

export interface DbRecordSaveEvent {
  db: string;
  collection: string;
  record: any;
  key: DbKey;
  keyPath?: string | string[];
}

export interface DbRecordDeleteEvent {
  db: string;
  collection: string;
  key: DbKey;
  keyPath?: string | string[];
}

export interface DbCollectionDropEvent {
  db: string;
  collection: string;
}

export interface DbDatabaseDropEvent {
  db: string;
}

export type DbEvent =
  | DbRecordSaveEvent
  | DbRecordDeleteEvent
  | DbCollectionDropEvent
  | DbDatabaseDropEvent
  | Error;

export function isDbRecordSaveEvent(
  event: DbEvent
): event is DbRecordSaveEvent {
  return event && (event as DbRecordSaveEvent).record !== undefined;
}

export function isDbRecordDeleteEvent(
  event: DbEvent
): event is DbRecordDeleteEvent {
  return event && (event as DbRecordDeleteEvent).key !== undefined;
}
