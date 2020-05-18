import * as WebSocket from "ws";
import { Db, DbDeleteEvent, DbFilterExpression, DbSaveEvent } from "../common/Db";
import { WsDbEvent, WsDbQueryParams, WsDbScalarParams } from "../common/WsDb";
import { WsServer } from "./WsServer";

export default class WsDbServer extends WsServer {
  private databases: Db[];

  constructor(databases: Db[], options: WebSocket.ServerOptions) {
    super(options);
    this.databases = databases;
    this.register(WsDbEvent.INSERTED, this.onInsert);
    this.register(WsDbEvent.UPDATED, this.onUpdate);
    this.register(WsDbEvent.DELETED, this.onDelete);
    this.register(WsDbEvent.SCHEMA, this.onSchema);
    this.register(WsDbEvent.SCALAR, this.onScalar);
    this.register(WsDbEvent.QUERY, this.onQuery);
  }

  private onInsert = (sender: string, event: DbSaveEvent) => {
    this.getDatabase(event.db)
      .insert(event.collection, event.record)
      .then(() => {
        this.broadcast(WsDbEvent.INSERTED, event, sender);
      });
  };

  private onUpdate = (sender: string, event: DbSaveEvent) => {
    this.getDatabase(event.db)
      .update(event.collection, event.record)
      .then(() => {
        this.broadcast(WsDbEvent.UPDATED, event, sender);
      });
  };

  private onDelete = (sender: string, event: DbDeleteEvent) => {
    this.getDatabase(event.db)
      .delete(event.collection, event.key)
      .then(() => {
        this.broadcast(WsDbEvent.DELETED, event, sender);
      });
  };

  private onSchema = (sender: string, event: any) =>
    this.databases.map((d) => d.getSchema());

  private onQuery = (sender: string, event: WsDbQueryParams) => {
    const select = this.getDatabase(event.db).select(event.collection);
    select._where = event.where
      ? new DbFilterExpression(event.where)
      : undefined;
    select._order = event.order;
    select._offset = event.offset;
    select._limit = event.limit;
    return select.toArray();
  };

  private onScalar = (sender: string, event: WsDbScalarParams) => {
    const select = this.getDatabase(event.db).select(event.collection);
    select._where = event.where
      ? new DbFilterExpression(event.where)
      : undefined;
    select._order = event.order;
    return select.first();
  };

  getDatabase(name: string): Db {
    for (const db of this.databases)
      if (name === db.getSchema().name) return db;
    throw new Error("Database not found: " + name);
  }
}
