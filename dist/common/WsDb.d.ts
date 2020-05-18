import { DbFilter, DbOrderBy } from "./Db";
export declare enum WsDbEvent {
    INSERTED = "INSERTED",
    UPDATED = "UPDATED",
    DELETED = "DELETED",
    QUERY = "QUERY",
    SCALAR = "SCALAR",
    SCHEMA = "SCHEMA"
}
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
