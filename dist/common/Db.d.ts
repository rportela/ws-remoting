import DbSchema from "./DbSchema";
export declare const DbActions: {
    INSERTED: string;
    UPDATED: string;
    DELETED: string;
};
export declare type DbQuery = string | number | Date | ArrayBufferView | ArrayBuffer | IDBArrayKey | IDBKeyRange;
export interface Db {
    getSchema(): DbSchema;
    add(collection: string, record: any): Promise<IDBValidKey>;
    put(collection: string, record: any): Promise<IDBValidKey>;
    delete(collection: string, id: string): Promise<string>;
    query(collection: string, query: DbQuery): Promise<any[]>;
    get(collection: string, query: DbQuery): Promise<any>;
}
