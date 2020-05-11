import { Db, DbQuery, DbSchema } from "../common/Interfaces";
/**
 *
 * @author Rodrigo Portela
 */
export default class ObservableDb implements Db {
    private db;
    private listeners;
    constructor(schema: DbSchema);
    /**
     *
     * @param collection
     * @param key
     * @param params
     */
    private _notify;
    /**
     *
     */
    getSchema(): DbSchema;
    /**
     *
     * @param collection
     * @param record
     * @param key
     */
    add(collection: string, record: any, key?: IDBValidKey): Promise<IDBValidKey>;
    /**
     *
     * @param collection
     * @param record
     * @param key
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
     * @param collection
     * @param query
     */
    query(collection: string, query: DbQuery): Promise<any[]>;
    /**
     *
     * @param collection
     * @param query
     */
    get(collection: string, query: DbQuery): Promise<any>;
    addListener(collection: string, key: string, listener: (...params: any) => void): void;
    removeListener(collection: string, key: string, listener: (...parans: any) => void): void;
}
