export interface DbIndexSchema {
    property: string;
    unique: boolean;
}
export interface DbCollectionSchema {
    name: string;
    keyPath?: string;
    autoIncrement?: boolean;
    indexes?: DbIndexSchema[] | null | undefined;
}
export interface DbSchema {
    version: number;
    name: string;
    collections: DbCollectionSchema[];
}
export declare type DbQuery = string | number | Date | ArrayBufferView | ArrayBuffer | IDBArrayKey | IDBKeyRange;
export interface Db {
    getSchema(): DbSchema;
    add(collection: string, record: any): Promise<IDBValidKey>;
    put(collection: string, record: any): Promise<IDBValidKey>;
    delete(collection: string, id: string): Promise<string>;
    query(collection: string, query: DbQuery): Promise<any[]>;
    get(collection: string, query: DbQuery): Promise<any>;
}
