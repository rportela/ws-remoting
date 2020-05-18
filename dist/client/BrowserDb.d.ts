import { DbSchema, DbFilter, DbOrderBy } from "../common/Db";
/**
 * Wraps an indexed db with promises to increase control and
 * developer productivity. This is dependent on the schema being
 * previously defined.
 *
 * @author Rodrigo Portela
 */
export default class BrowserDb {
    private open;
    private schema;
    /**
     * Performs a database upbrade based on a defined schema.
     * Old object stores are all deleted if not present on the schema.
     * Collections and their indexes defined on the schema are created.
     */
    private _upgrade;
    /**
     * Attempts to open a connection to the named database with the current version,
     * or 1 if it does not already exist.
     * If the request is successful request's result will be the connection.
     *
     * @param schema
     */
    constructor(schema: DbSchema);
    /**
     * Gets the current database schema.
     */
    getSchema(): DbSchema;
    /**
     * Adds or updates a record in store with the given value and key.
     * If the store uses in-line keys and key is specified a "DataError" DOMException will be thrown.
     * If put() is used, any existing record with the key will be replaced.
     * If add() is used, and if a record with the key already exists the request will fail, with request's error set to a "ConstraintError" DOMException.
     * If successful, request's result will be the record's key.
     *
     * @param collection
     * @param record
     * @param key
     */
    add(collection: string, record: any, key?: IDBValidKey): Promise<IDBValidKey>;
    /**
     * Adds or updates a record in store with the given value and key.
     * If the store uses in-line keys and key is specified a "DataError" DOMException will be thrown.
     * If put() is used, any existing record with the key will be replaced.
     * If add() is used, and if a record with the key already exists the request will fail, with request's error set to a "ConstraintError" DOMException.
     * If successful, request's result will be the record's key.
     *
     * @param collection
     * @param record
     * @param key
     */
    put(collection: string, record: any, key?: IDBValidKey): Promise<IDBValidKey>;
    /**
     * Deletes records in store with the given key or in the given key range in query.
     * If successful, request's result will be undefined.
     *
     * @param collection
     * @param key
     */
    delete(collection: string, key: string | number): Promise<undefined>;
    /**
     * Opens a cursor over the records matching query, ordered by direction.
     * If query is null, all records in store are matched.
     * If successful, request's result will be an IDBCursorWithValue pointing at the first matching record, or null if there were no matching records.
     *
     * @param collection
     * @param query
     * @param direction
     */
    all(collection: string, query?: string | number | Date | ArrayBufferView | ArrayBuffer | IDBArrayKey | IDBKeyRange, direction?: IDBCursorDirection): Promise<any[]>;
    /**
     * Opens a cursor with key only flag set over the records matching query, ordered by direction.
     * If query is null, all records in store are matched.
     * If successful, request's result will be an IDBCursor pointing at the first matching record, or null if there were no matching records.
     *
     * @param collection
     * @param query
     * @param direction
     */
    allKeys(collection: string, query?: string | number | Date | ArrayBufferView | ArrayBuffer | IDBArrayKey | IDBKeyRange, direction?: IDBCursorDirection): Promise<any[]>;
    /**
     * Retrieves the value of the first record matching the given key or key range in query.
     * If successful, request's result will be the value, or undefined if there was no matching record.
     *
     * @param collection
     * @param query
     */
    get(collection: string, query?: string | number | Date | ArrayBufferView | ArrayBuffer | IDBArrayKey | IDBKeyRange): Promise<any>;
    /**
     * The execution of a real query.
     *
     * @param collection
     * @param where
     * @param orderBy
     * @param offset
     * @param limit
     */
    query(collection: string, where?: DbFilter, orderBy?: DbOrderBy, offset?: number, limit?: number): Promise<any[]>;
    /**
     * The first element of a query.
     *
     * @param collection
     * @param where
     * @param orderBy
     * @param offset
     * @param limit
     */
    first(collection: string, where?: DbFilter, orderBy?: DbOrderBy): Promise<any>;
}
