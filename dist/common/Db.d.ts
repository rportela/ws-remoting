/**
 *
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
    NOT_LIKE = 9
}
/**
 *
 */
export declare enum DbFilterOperation {
    AND = 0,
    OR = 1
}
/**
 *
 */
export declare enum DbFilterType {
    TERM = 0,
    NODE = 1,
    EXPRESSION = 2
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
export declare class DbFilterTerm implements DbFilter {
    name: string;
    comparison: DbFilterComparison;
    value: any;
    constructor(name: string, comparison: DbFilterComparison, value: any);
    filterRecord(record: any): boolean;
    filterType(): DbFilterType;
}
/**
 *
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
 * This represents a filter expresison.
 */
export declare class DbFilterExpression implements DbFilter {
    first: DbFilterNode;
    last: DbFilterNode;
    constructor(filter: DbFilter);
    filterRecord(record: any): boolean;
    filterType(): DbFilterType;
    and(filter: DbFilter): DbFilterExpression;
    or(filter: DbFilter): DbFilterExpression;
}
export declare class DbOrderBy {
    name: string;
    descending: boolean;
    next: DbOrderBy;
    constructor(name: string, descending?: boolean);
    createComparer(): (a: any, b: any) => number;
    sort(arr: any[]): void;
}
/**
 *
 */
export declare abstract class DbSelect<T> {
    _where: DbFilterExpression;
    _order: DbOrderBy;
    _offset: number;
    _limit: number;
    where(filter: DbFilter): DbSelect<T>;
    and(filter: DbFilter): DbSelect<T>;
    or(filter: DbFilter): DbSelect<T>;
    offset(offset: number): DbSelect<T>;
    limit(limit: number): DbSelect<T>;
    orderBy(name: string, descending?: boolean): DbSelect<T>;
    thenOrderBy(name: string, descending?: boolean): DbSelect<T>;
    abstract first(): Promise<T>;
    abstract toArray(): Promise<T[]>;
}
export declare type DbKey = string | number;
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
export declare enum DbEvent {
    INSERTED = "INSERTED",
    UPDATED = "UPDATED",
    DELETED = "DELETED",
    UPGRADED = "UPGRADED"
}
export declare class DbSaveEvent {
    db: string;
    collection: string;
    keyPath: string;
    key: DbKey;
    record: any;
}
export declare class DbDeleteEvent {
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
