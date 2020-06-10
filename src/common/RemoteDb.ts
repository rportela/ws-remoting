import { DbRecordSaveEvent, DbRecordDeleteEvent } from "./DbEvents";
import { DbFilter } from "./DbFilters";
import { DbOrderBy } from "./DbSort";

export enum RemoteDbEventType {
  QUERY = "WS_DB_QUERY",
  SCALAR = "WS_DB_SCALAR",
  SCHEMA = "WS_DB_SCHEMA",
  SYNC = "WS_DB_SYNC",
}

export type RemoteDbSaveParams = {
  clientId: string;
  dbevent: DbRecordSaveEvent;
};

export type RemoteDbDeleteParams = {
  clientId: string;
  dbevent: DbRecordDeleteEvent;
};

export type RemoteDbQueryParams = {
  db: string;
  collection: string;
  where?: DbFilter;
  order?: DbOrderBy;
  offset?: number;
  limit?: number;
};

export type RemoteDbScalarParams = {
  db: string;
  collection: string;
  where?: DbFilter;
  order?: DbOrderBy;
};

export type RemoteDbSyncParams = {
  db: string;
  collection: string;
  lastUpdatedAt?: Date;
};
