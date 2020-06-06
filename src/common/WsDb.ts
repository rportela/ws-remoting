import {
  DbFilter,
  DbOrderBy,
  DbRecordSaveEvent,
  DbRecordDeleteEvent,
} from "./Db";

export enum WsDbEventType {
  ADD = "WS_DB_ADD",
  PUT = "WS_DB_PUT",
  DELETE = "WS_DB_DELETE",
  QUERY = "WS_DB_QUERY",
  SCALAR = "WS_DB_SCALAR",
  SCHEMA = "WS_DB_SCHEMA",
  SYNC = "WS_DB_SYNC",
}

export type WsDbSaveParams = {
  clientId: string;
  dbevent: DbRecordSaveEvent;
};

export type WsDbDeleteParams = {
  clientId: string;
  dbevent: DbRecordDeleteEvent;
};

export type WsDbQueryParams = {
  db: string;
  collection: string;
  where?: DbFilter;
  order?: DbOrderBy;
  offset?: number;
  limit?: number;
};

export type WsDbScalarParams = {
  db: string;
  collection: string;
  where?: DbFilter;
  order?: DbOrderBy;
};

export type WsDbSyncParams = {
  db: string;
  collection: string;
  lastUpdatedAt?: Date;
};
