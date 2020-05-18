import { Db, DbQuery } from "../common/Db";
import DbSchema from "../common/DbSchema";
export default class WsDb implements Db {
    private db;
    private socket;
    private messagedb;
    private opening;
    constructor(url: string, db: string);
    private _onRecordInserted;
    private _onRecordUpdated;
    private _onRecordDeleted;
    private _receiveSchema;
    private _sync;
    private _query_data;
    private _dispatchErrors;
    private _notify;
    /**
     *
     */
    createId(): string;
    /**
     *
     */
    getSchema(): DbSchema;
    /**
     *
     * @param collection
     * @param record
     */
    add(collection: string, record: any): Promise<IDBValidKey>;
    /**
     *
     * @param collection
     * @param record
     */
    put(collection: string, record: any): Promise<IDBValidKey>;
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
    queryByIndex(collection: string, index: string, query: DbQuery): Promise<any[]>;
    getByIndex(collection: string, index: string, query: DbQuery): Promise<any>;
    first(collection: string, query: DbQuery): Promise<any>;
    firstByIndex(collection: string, index: string, query: DbQuery): Promise<any>;
    last(collection: string, query: DbQuery): Promise<any>;
    lastByIndex(collection: string, index: string, query: DbQuery): Promise<any>;
    /**
     *
     * @param collection
     * @param key
     * @param listener
     */
    addListener(collection: string, key: string, listener: (...params: any[]) => any): Promise<void>;
    /**
     *
     * @param collection
     * @param key
     * @param listener
     */
    removeListener(collection: string, key: string, listener: (...params: any[]) => any): Promise<any>;
}
