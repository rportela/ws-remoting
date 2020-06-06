import { DbFilter, DbOrderBy, DbRecordSaveEvent, DbRecordDeleteEvent } from "./Db";
export declare enum WsDbEventType {
    ADD = "WS_DB_ADD",
    PUT = "WS_DB_PUT",
    DELETE = "WS_DB_DELETE",
    QUERY = "WS_DB_QUERY",
    SCALAR = "WS_DB_SCALAR",
    SCHEMA = "WS_DB_SCHEMA",
    SYNC = "WS_DB_SYNC"
}
export declare type WsDbSaveParams = {
    clientId: string;
    dbevent: DbRecordSaveEvent;
};
export declare type WsDbDeleteParams = {
    clientId: string;
    dbevent: DbRecordDeleteEvent;
};
export declare type WsDbQueryParams = {
    db: string;
    collection: string;
    where?: DbFilter;
    order?: DbOrderBy;
    offset?: number;
    limit?: number;
};
export declare type WsDbScalarParams = {
    db: string;
    collection: string;
    where?: DbFilter;
    order?: DbOrderBy;
};
export declare type WsDbSyncParams = {
    db: string;
    collection: string;
    lastUpdatedAt?: Date;
};
