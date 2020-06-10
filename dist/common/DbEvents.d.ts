import { DbKey } from "./Db";
export declare enum DbEventType {
    ADD = "DB_ADD",
    PUT = "DB_PUT",
    DELETE = "DB_DELETE",
    UPGRADED = "DB_UPGRADE",
    OPEN = "DB_OPEN",
    CLOSED = "DB_CLOSED",
    CLEAR = "DB_CLEAR",
    ERROR = "ERROR"
}
export interface DbRecordSaveEvent {
    db: string;
    collection: string;
    record: any;
    key: DbKey;
    keyPath?: string | string[];
}
export interface DbRecordDeleteEvent {
    db: string;
    collection: string;
    key: DbKey;
    keyPath?: string | string[];
}
export interface DbCollectionClearEvent {
    db: string;
    collection: string;
}
export interface DbDatabaseDropEvent {
    db: string;
}
export declare type DbEvent = DbRecordSaveEvent | DbRecordDeleteEvent | DbCollectionClearEvent | DbDatabaseDropEvent | Error;
export declare function isDbRecordSaveEvent(event: DbEvent): event is DbRecordSaveEvent;
export declare function isDbRecordDeleteEvent(event: DbEvent): event is DbRecordDeleteEvent;
