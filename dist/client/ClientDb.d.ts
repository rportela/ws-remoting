import { Db, DbQuery } from "../common/Db";
import DbSchema from "../common/DbSchema";
/**
 * This class wraps a local indexedb and exposes method to allow syncing and adding;
 *
 * @author Rodrigo Portela
 */
export default class ClientDb implements Db {
    private db;
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
    /**
     *
     * @param collection
     * @param record
     */
    add(collection: string, record: any, key?: IDBValidKey): Promise<IDBValidKey>;
    /**
     *
     * @param collection
     * @param record
     */
    put(collection: string, record: any, key?: IDBValidKey): Promise<IDBValidKey>;
    /**
     *
     * @param collection
     * @param id
     */
    delete(collection: string, id: string): Promise<string>;
    /**
     *
     */
    getSchema(): DbSchema;
    /**
     *
     */
    get(collection: string, query: DbQuery): Promise<unknown>;
    /**
     *
     * @param collection
     * @param query
     * @param direction
     */
    query(collection: string, query?: DbQuery, direction?: IDBCursorDirection): Promise<any[]>;
    addListener(collection: string, key: string, listener: (params: any) => void): void;
    removeListener(collection: string, key: string, listener: (params: any) => void): void;
    notifyListener(collection: string, key: string, params: any): void;
}
