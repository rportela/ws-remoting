import * as WebSocket from "ws";
import { WsServer, WsServerAction } from "./WsServer";
import { Db, DbQuery } from "../common/Db";
import WsDbActions from "../common/WsDbActions";
import WsDbSaveParams from "../common/WsDbSaveParams";
import WsDbDeleteParams from "../common/WsDbDeleteParams";
import WsDbQueryParams from "../common/WsDbQueryParams";

export default class WsDbServer extends WsServer {
  private databases: Db[];

  constructor(databases: Db[], options: WebSocket.ServerOptions) {
    super(options);
    this.databases = databases;
    this.register(WsDbActions.INSERTED, this.on_inserted);
    this.register(WsDbActions.UPDATED, this.on_updated);
    this.register(WsDbActions.DELETED, this.on_deleted);
    this.register(WsDbActions.SCHEMA, this.on_get_schema);
    this.register(WsDbActions.GET, this.on_get);
    this.register(WsDbActions.QUERY, this.on_query);
  }

  getDatabase(name: string): Db {
    for (const db of this.databases)
      if (name === db.getSchema().name) return db;
    throw new Error("Database not found: " + name);
  }

  private on_inserted = (sender: string, params: WsDbSaveParams) => {
    this.getDatabase(params.db)
      .add(params.name, params.record)
      .then(() => this.broadcast(WsDbActions.INSERTED, params, sender));
  };

  private on_updated = (sender: string, params: WsDbSaveParams) => {
    this.getDatabase(params.db)
      .put(params.name, params.record)
      .then(() => this.broadcast(WsDbActions.UPDATED, params, sender));
  };

  private on_deleted = (sender: string, params: WsDbDeleteParams) => {
    this.getDatabase(params.db)
      .delete(params.name, params.key)
      .then(() => this.broadcast(WsDbActions.DELETED, params, sender));
  };

  private on_get_schema = (sender: string, db_name: string) => {
    return this.getDatabase(db_name).getSchema();
  };

  private on_get = (sender: string, params: WsDbQueryParams) => {
    return this.getDatabase(params.db).get(params.name, params.query);
  };

  private on_query = (sender: string, params: WsDbQueryParams) => {
    return this.getDatabase(params.db).query(params.name, params.query);
  };
}
