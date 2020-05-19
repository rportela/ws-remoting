import { Db, DbSchemaCollection, DbKey, DbSelect, DbSchema, DbSaveEvent, DbDeleteEvent } from "../common/Db";
import BrowserDb from "./BrowserDb";
export declare class ObservableDbSelect<T> extends DbSelect<T> {
    db: BrowserDb;
    collection: string;
    constructor(db: BrowserDb, collection: string);
    first(): Promise<T>;
    toArray(): Promise<T[]>;
}
export declare class ObservableDb implements Db {
    db: BrowserDb;
    listeners: any;
    constructor(schema: DbSchema);
    createId(): string;
    /**
     *
     * @param collection
     * @param action
     * @param params
     */
    notifyListeners(collection: string, action: string, params: any): void;
    /**
     *
     */
    getSchema(): DbSchema;
    /**
     *
     * @param collection
     */
    getCollectionSchema(collection: string): DbSchemaCollection;
    /**
     *
     * @param collection
     */
    getCollectionKeyPath(collection: string): string | null;
    /**
     *
     * @param collection
     */
    select<T>(collection: string): DbSelect<T>;
    /**
     *
     * @param collection
     * @param record
     */
    insert<T>(collection: string, record: T, notify?: boolean): Promise<DbSaveEvent>;
    /**
     *
     * @param collection
     * @param record
     */
    update<T>(collection: string, record: T, notify?: boolean): Promise<DbSaveEvent>;
    /**
     *
     * @param collection
     * @param record
     */
    upsert<T>(collection: string, record: T, notify?: boolean): Promise<DbSaveEvent>;
    /**
     *
     * @param collection
     * @param id
     */
    delete(collection: string, id: DbKey, notify?: boolean): Promise<DbDeleteEvent>;
    addListener(collection: string, key: string, listener: (params: any) => void): void;
    removeListener(collection: string, key: string, listener: (params: any) => void): void;
}
