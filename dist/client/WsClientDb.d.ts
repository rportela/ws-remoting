import { Db } from "../common/Db";
export default class WsClientDb implements Db {
    getSchema(): import("../common/Db").DbSchema;
    getCollectionSchema(collection: string): import("../common/Db").DbSchemaCollection;
    select<T>(collection: string): import("../common/Db").DbSelect<T>;
    insert<T>(collection: string, record: T): Promise<import("../common/Db").DbKey>;
    update<T>(collection: string, record: T): Promise<import("../common/Db").DbKey>;
    upsert<T>(collection: string, record: T): Promise<import("../common/Db").DbKey>;
    delete(collection: string, id: import("../common/Db").DbKey): Promise<import("../common/Db").DbKey>;
}
