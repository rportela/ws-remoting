import { DbFilterExpression, DbOrderBy } from "./Db";
declare const _default: {
    INSERTED: any;
    UPDATED: any;
    DELETED: any;
    SCHEMA: string;
    QUERY: string;
    GET: string;
};
export default _default;
export declare type WsDbDeleteParams = {
    db: string;
    collection: string;
    key: string;
};
export declare type WsDbSaveParams = {
    db: string;
    collection: string;
    record: any;
};
export declare type WsDbQueryParams = {
    db: string;
    collection: string;
    where?: DbFilterExpression;
    order?: DbOrderBy;
    offset?: number;
    limit?: number;
};
export declare type WsDbScalarParams = {
    db: string;
    collection: string;
    where?: DbFilterExpression;
    order?: DbOrderBy;
};
