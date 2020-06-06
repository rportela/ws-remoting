/**
 * Currently available database key types.
 *  * @author Rodrigo Portela.
 */
export declare type DbKey = string | number;
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
export declare enum DbFilterComparison {
  EQUALS_TO = 0,
  NOT_EQUALS_TO = 1,
  GREATER_THAN = 2,
  GRATER_OR_EQUAL = 3,
  LOWER_THAN = 4,
  LOWER_OR_EQUAL = 5,
  IN = 6,
  NOT_IN = 7,
  LIKE = 8,
  NOT_LIKE = 9,
}
/**
 * The filter join operation. Either an AND or an OR.
 */
export declare enum DbFilterOperation {
  AND = 0,
  OR = 1,
}
/**
 * The type of filter that a filter class should have.
 */
export declare enum DbFilterType {
  TERM = 0,
  NODE = 1,
  EXPRESSION = 2,
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
export declare class DbFilterTerm implements DbFilter {
  name: string;
  comparison: DbFilterComparison;
  value: any;
  constructor(name: string, comparison: DbFilterComparison, value: any);
  filterRecord(record: any): boolean;
  filterType(): DbFilterType;
}
/**
 * A database filter expression node.
 */
export declare class DbFilterNode implements DbFilter {
  filter: DbFilter;
  operation?: DbFilterOperation;
  next?: DbFilterNode;
  constructor(filter: DbFilter);
  filterRecord(record: any): boolean;
  filterType(): DbFilterType;
}
/**
 * A database filter expression.
 */
export declare class DbFilterExpression implements DbFilter {
  private first;
  private last;
  constructor(filter: DbFilter);
  filterRecord(record: any): boolean;
  filterType(): DbFilterType;
  and(filter: DbFilter): DbFilterExpression;
  or(filter: DbFilter): DbFilterExpression;
}
/**
 * Wraps a sequence of order by expressions where you can define
 * a column name and a direction for the sort.
 * @author Rodrigo Portela
 */
export declare class DbOrderBy {
  name: string;
  descending: boolean;
  next?: DbOrderBy;
  constructor(name: string, descending?: boolean);
  createComparer(): (a: any, b: any) => number;
  sort(arr: any[]): void;
}
/**
 * Interfaces a database select with configurable where clause,
 * orderBy clause, offset number and a limit of records.
 * @author Rodrigo Portela
 */
export declare abstract class DbSelect<T> {
  _from: string;
  _where: DbFilter;
  _orderBy: DbOrderBy;
  _offset: number;
  _limit: number;
  constructor(from: string);
  where(filter: DbFilterTerm | DbFilterExpression): DbSelect<T>;
  orWhere(filter: DbFilterTerm | DbFilterExpression): DbSelect<T>;
  andWhere(filter: DbFilterTerm | DbFilterExpression): DbSelect<T>;
  orderBy(name: string, descending?: boolean): DbSelect<T>;
  thenOrderBy(name: string, descending?: boolean): DbSelect<T>;
  offset(count: number): DbSelect<T>;
  limit(count: number): DbSelect<T>;
  page(page: number, pageSize: number): DbSelect<T>;
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
export declare class NaiveDbSelect<T> extends DbSelect<T> {
  db: Db;
  constructor(db: Db, collection: string);
  count(): Promise<number>;
  first(): Promise<T>;
  all(): Promise<T[]>;
}
export declare enum DbEventType {
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
export declare type DbEvent =
  | DbRecordSaveEvent
  | DbRecordDeleteEvent
  | DbCollectionDropEvent
  | DbDatabaseDropEvent
  | Error;
export declare function isDbRecordSaveEvent(
  event: DbEvent
): event is DbRecordSaveEvent;
export declare function isDbRecordDeleteEvent(
  event: DbEvent
): event is DbRecordDeleteEvent;
