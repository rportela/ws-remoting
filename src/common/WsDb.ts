import { DbFilter, DbOrderBy } from "./Db";

export enum WsDbEvent {
  INSERTED = "INSERTED",
  UPDATED = "UPDATED",
  DELETED = "DELETED",
  QUERY = "QUERY",
  SCALAR = "SCALAR",
  SCHEMA = "SCHEMA",
}

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
