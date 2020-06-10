import { DbRecordSaveEvent, DbRecordDeleteEvent } from "./DbEvents";
import { DbFilter } from "./DbFilters";
import { DbOrderBy } from "./DbSort";
export declare enum RemoteDbEventType {
    QUERY = "WS_DB_QUERY",
    SCALAR = "WS_DB_SCALAR",
    SCHEMA = "WS_DB_SCHEMA",
    SYNC = "WS_DB_SYNC"
}
export declare type RemoteDbSaveParams = {
    clientId: string;
    dbevent: DbRecordSaveEvent;
};
export declare type RemoteDbDeleteParams = {
    clientId: string;
    dbevent: DbRecordDeleteEvent;
};
export declare type RemoteDbQueryParams = {
    db: string;
    collection: string;
    where?: DbFilter;
    order?: DbOrderBy;
    offset?: number;
    limit?: number;
};
export declare type RemoteDbScalarParams = {
    db: string;
    collection: string;
    where?: DbFilter;
    order?: DbOrderBy;
};
export declare type RemoteDbSyncParams = {
    db: string;
    collection: string;
    lastUpdatedAt?: Date;
};
