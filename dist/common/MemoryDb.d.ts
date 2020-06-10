import { Db, DbKey, DbSchema } from "./Db";
import { DbSelect } from "./DbSelect";
import { DbCollectionClearEvent, DbDatabaseDropEvent } from "./DbEvents";
export declare class MemoryDb implements Db {
    private schema;
    private records;
    constructor(schema: DbSchema);
    getSchema(): DbSchema;
    get(collection: string, key: DbKey): Promise<any>;
    getAll(collection: string): Promise<any[]>;
    select<T>(collection: string): DbSelect<T>;
    add(collection: string, record: any): Promise<any>;
    put(collection: string, record: any): Promise<any>;
    delete(collection: string, key: DbKey): Promise<any>;
    clear(collection: string): Promise<DbCollectionClearEvent>;
    drop(): Promise<DbDatabaseDropEvent>;
}
export declare class MemoryDbSelect<T> extends DbSelect<T> {
    count(): Promise<number>;
    first(): Promise<T>;
    all(): Promise<T[]>;
    forEach(fn: (param: T) => any): void;
}
