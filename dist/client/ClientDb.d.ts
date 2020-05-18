import { Db, DbSchema, DbSelect, DbSchemaCollection } from "../common/Db";
/**
 * This class implements an IndexedDB Select statement.
 * It is able to filter the results using the where clause.
 * It needs an index for the initial order by. Subsequent order by clauses are executed
 * on the resulting array.
 *
 * @author Rodrigo Portela
 */
export declare class ClientDbSelect<T> extends DbSelect<T> {
    db: Promise<IDBDatabase>;
    schema: DbSchemaCollection;
    constructor(db: Promise<IDBDatabase>, schema: DbSchemaCollection);
    private _createCursorRequest;
    first(): Promise<T>;
    toArray(): Promise<T[]>;
}
/**
 * This class wraps a local indexedb and exposes method to allow syncing and adding;
 *
 * @author Rodrigo Portela
 */
export declare class ClientDb implements Db {
    private opening;
    private schema;
    private listeners;
    /**
     * This method performs the upgrade of the database with a new schema.
     */
    private _upgrade;
    /**
     * This method constructs a client db with a specific schema;
     *
     * @param schema
     */
    constructor(schema: DbSchema);
    getSchema(): DbSchema;
    getCollectionSchema(collection: string): DbSchemaCollection;
    select<T>(collection: string): DbSelect<T>;
    insert<T>(collection: string, record: T): Promise<T>;
    update<T>(collection: string, record: T): Promise<T>;
    /**
     *
     * @param collection
     * @param id
     */
    delete(collection: string, id: string): Promise<string>;
    addListener(collection: string, key: string, listener: (params: any) => void): void;
    removeListener(collection: string, key: string, listener: (params: any) => void): void;
    notifyListener(collection: string, key: string, params: any): void;
}
