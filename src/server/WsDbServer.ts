import {
  Db,
  DbEventType,
  DbFilterExpression,
  DbRecordSaveEvent,
  DbRecordDeleteEvent,
} from "../common/Db";
import {
  WsDbEventType,
  WsDbQueryParams,
  WsDbScalarParams,
  WsDbSyncParams,
} from "../common/WsDb";
import { JsonRpcServer, JsonRpcServerSocket } from "./JsonRpcServer";

export default class WsDbServer extends JsonRpcServer {
  private databases: Db[];

  constructor(databases: Db[]) {
    super();
    this.databases = databases;
    super.setHandler(DbEventType.ADD, this.onAdd);
    super.setHandler(DbEventType.PUT, this.onPut);
    super.setHandler(DbEventType.DELETE, this.onDelete);
    super.setHandler(WsDbEventType.SCHEMA, this.onSchema);
    super.setHandler(WsDbEventType.SCALAR, this.onScalar);
    super.setHandler(WsDbEventType.QUERY, this.onQuery);
    super.setHandler(WsDbEventType.SYNC, this.onSync);
  }

  private onAdd = (client: JsonRpcServerSocket, event: DbRecordSaveEvent) => {
    this.getDatabase(event.db)
      .add(event.collection, event.record)
      .then(() => {
        this.broadcast(DbEventType.ADD, event, client.id);
      });
  };

  private onPut = (client: JsonRpcServerSocket, event: DbRecordSaveEvent) => {
    this.getDatabase(event.db)
      .put(event.collection, event.record)
      .then(() => {
        this.broadcast(DbEventType.PUT, event, client.id);
      });
  };

  private onDelete = (
    client: JsonRpcServerSocket,
    event: DbRecordDeleteEvent
  ) => {
    this.getDatabase(event.db)
      .delete(event.collection, event.key)
      .then(() => {
        this.broadcast(DbEventType.DELETE, event, client.id);
      });
  };

  private onSchema = () => this.databases.map((d) => d.getSchema());

  private onQuery = (client: JsonRpcServerSocket, event: WsDbQueryParams) => {
    const select = this.getDatabase(event.db).select(event.collection);
    select._where = event.where
      ? new DbFilterExpression(event.where)
      : undefined;
    select._orderBy = event.order;
    select._offset = event.offset;
    select._limit = event.limit;
    return select.all();
  };

  private onScalar = (client: JsonRpcServerSocket, event: WsDbScalarParams) => {
    const select = this.getDatabase(event.db).select(event.collection);
    select._where = event.where
      ? new DbFilterExpression(event.where)
      : undefined;
    select._orderBy = event.order;
    return select.first();
  };

  private onSync = (client: JsonRpcServerSocket, event: WsDbSyncParams) => {
    
  };

  getDatabase(name: string): Db {
    for (const db of this.databases)
      if (name === db.getSchema().name) return db;
    throw new Error("Database not found: " + name);
  }
}
