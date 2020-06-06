import { Db, DbSchema, DbKey, DbSelect, DbDatabaseDropEvent, DbCollectionDropEvent } from "./Db";
export declare class MemoryDb implements Db {
    private schema;
    private records;
    constructor(schema: DbSchema);
    getSchema(): DbSchema;
    get(collection: string, key: DbKey): Promise<any>;
    all(collection: string): Promise<any[]>;
    select<T>(collection: string): DbSelect<T>;
    add(collection: string, record: any): Promise<any>;
    put(collection: string, record: any): Promise<any>;
    delete(collection: string, key: DbKey): Promise<any>;
    dropCollection(collection: string): Promise<DbCollectionDropEvent>;
    drop(): Promise<DbDatabaseDropEvent>;
}
