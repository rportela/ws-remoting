import { Db, DbSchemaCollection } from "../common/Db";
import { DbEventType, DbRecordDeleteEvent, DbRecordSaveEvent } from "../common/DbEvents";
import { DbFilterComparison, DbFilterExpression, DbFilterTerm } from "../common/DbFilters";
import { RemoteDbEventType, RemoteDbQueryParams, RemoteDbScalarParams, RemoteDbSyncParams } from "../common/RemoteDb";
import { JsonRpcServer, JsonRpcServerSocket } from "./JsonRpcServer";

export default class RemoteDbServer extends JsonRpcServer {
  private databases: Db[];

  constructor(databases: Db[]) {
    super();
    this.databases = databases;
    super.setHandler(DbEventType.ADD, this.onAdd);
    super.setHandler(DbEventType.PUT, this.onPut);
    super.setHandler(DbEventType.DELETE, this.onDelete);
    super.setHandler(RemoteDbEventType.SCHEMA, this.onSchema);
    super.setHandler(RemoteDbEventType.SCALAR, this.onScalar);
    super.setHandler(RemoteDbEventType.QUERY, this.onQuery);
    super.setHandler(RemoteDbEventType.SYNC, this.onSync);
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

  private onQuery = (
    client: JsonRpcServerSocket,
    event: RemoteDbQueryParams
  ) => {
    const select = this.getDatabase(event.db).select(event.collection);
    select._where = event.where
      ? new DbFilterExpression(event.where)
      : undefined;
    select._orderBy = event.order;
    select._offset = event.offset;
    select._limit = event.limit;
    return select.all();
  };

  private onScalar = (
    client: JsonRpcServerSocket,
    event: RemoteDbScalarParams
  ) => {
    const select = this.getDatabase(event.db).select(event.collection);
    select._where = event.where
      ? new DbFilterExpression(event.where)
      : undefined;
    select._orderBy = event.order;
    return select.first();
  };
  private onSync = (client: JsonRpcServerSocket, event: RemoteDbSyncParams) => {
    const db = this.getDatabase(event.db);
    const select = db.select(event.collection);
    if (event.lastUpdatedAt)
      select.where(
        new DbFilterTerm(
          "updatedAt",
          DbFilterComparison.GREATER_THAN,
          event.lastUpdatedAt
        )
      );
    const colSchema: DbSchemaCollection = db
      .getSchema()
      .collections.find((c) => c.name === event.collection);

    select.forEach((record: any) => {
      const not: DbRecordSaveEvent = {
        db: event.db,
        collection: event.collection,
        record: record,
        keyPath: colSchema.keyPath,
        key: record[colSchema.keyPath.toString()],
      };
      console.log("Notifying record to put", event.db, event.collection, not);
      client.notify(DbEventType.PUT, record);
    });
  };

  getDatabase(name: string): Db {
    for (const db of this.databases)
      if (name === db.getSchema().name) return db;
    throw new Error("Database not found: " + name);
  }
}
