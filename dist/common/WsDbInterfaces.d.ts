import { DbQuery } from "./Interfaces";
export declare const WsDbActions: {
    INSERTED: string;
    UPDATED: string;
    DELETED: string;
    SCHEMA: string;
    QUERY: string;
    GET: string;
};
export interface WsDbSaveParams {
    db: string;
    name: string;
    record: any;
}
export interface WsDbDeleteParams {
    db: string;
    name: string;
    key: string;
}
export interface WsDbQueryParams {
    db: string;
    name: string;
    query?: DbQuery;
}
export interface WsDbGetParams {
    db: string;
    name: string;
    query: DbQuery;
}
