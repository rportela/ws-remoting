import { Db, DbCollectionDropEvent, DbDatabaseDropEvent, DbEventType, DbKey, DbRecordDeleteEvent, DbRecordSaveEvent, DbSchema, DbSelect } from "../common/Db";
/**
 * Wraps indexed db functionality with promises for a better developer experience.
 * And it has an event emmiter attached to it so every operation can be observed from
 * the UI or any other listener.
 *
 * @author Rodrigo Portela
 */
export default class ObservableDb implements Db {
    private schema;
    private open;
    private emitter;
    /**
     * Destroys every previos object store and creates new ones based on schema.
     * IMPORTANT: all data is deleted from the database.
     */
    private onUpgradeNeeded;
    /**
     * Construcs an IDB with a promise that it will either open or a rejection will happen.
     *
     * @param schema
     */
    constructor(schema: DbSchema);
    /**
     * Creates time incremental unique ids.
     */
    static createId(): string;
    /**
     * Attaches a listener to a specific event.
     * @param event
     * @param listener
     */
    on(event: DbEventType, listener: (params: any) => void): void;
    /**
     * Detaches a listener from a specific event.
     * @param event
     * @param listener
     */
    off(event: DbEventType, listener: (params: any) => void): void;
    /**
     * Drops a collection and emits the corresponding event.
     *
     * @param collection
     */
    dropCollection(collection: string): Promise<DbCollectionDropEvent>;
    /**
     * Closes, drops the entire database and emmits the corresponding event.
     */
    drop(): Promise<DbDatabaseDropEvent>;
    /**
     * Gets the current schema of the database.
     */
    getSchema(): DbSchema;
    /**
     * Gets a specific member of a collection by it's key.
     *
     * @param collection
     * @param key
     */
    get(collection: string, key: DbKey): Promise<any>;
    /**
     * Gets all members of a collection.
     *
     * @param collection
     */
    all(collection: string): Promise<any[]>;
    /**
     * Creates a select object for a specific collection.
     *
     * @param collection
     */
    select<T>(collection: string): DbSelect<T>;
    /**
     * Adds or updates a record in store with the given value and key.
     * If the store uses in-line keys and key is specified a "DataError" DOMException will be thrown.
     * If put() is used, any existing record with the key will be replaced.
     * If add() is used, and if a record with the key already exists the request will fail, with request's error set to a "ConstraintError" DOMException.
     * If successful, request's result will be the record's key.
     * The corresponding event will be emited.
     *
     * @param collection
     * @param record
     */
    add(collection: string, record: any): Promise<DbRecordSaveEvent>;
    /**
     * Adds or updates a record in store with the given value and key.
     * If the store uses in-line keys and key is specified a "DataError" DOMException will be thrown.
     * If put() is used, any existing record with the key will be replaced.
     * If add() is used, and if a record with the key already exists the request will fail, with request's error set to a "ConstraintError" DOMException.
     * If successful, request's result will be the record's key.
     * The corresponding event will be emited.
     *
     * @param collection
     * @param record
     */
    put(collection: string, record: any): Promise<DbRecordSaveEvent>;
    /**
     * Deletes records in store with the given key or in the given key range in query.
     * If successful, request's result will be undefined.
     * And the corresponding event will be emited.
     *
     * @param collection
     * @param key
     */
    delete(collection: string, key: DbKey): Promise<DbRecordDeleteEvent>;
    close(): Promise<void>;
}
