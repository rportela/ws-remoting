import { DbSchema } from "../common/Db";
import { RemoteDbEventType, RemoteDbSyncParams } from "../common/RemoteDb";
import ObservableDb from "./ObservableDb";
import WebSocketRpc from "./WebSocketRpc";
import { WebSocketEventType } from "./WebSocketClient";
import {
  DbRecordSaveEvent,
  DbEventType,
  DbRecordDeleteEvent,
} from "../common/DbEvents";

const WS_DB_SCHEMA = "WS_DB_SCHEMA";

export default class WsDbClient extends WebSocketRpc {
  private schemas: DbSchema[];
  private dbs: Promise<ObservableDb[]>;

  private onRecordAdd = (event: DbRecordSaveEvent) => {
    console.log("local record add", event);
    this.notify(DbEventType.ADD, event);
  };

  private onRecordPut = (event: DbRecordSaveEvent) => {
    console.log("local record put", event);
    this.notify(DbEventType.PUT, event);
  };

  private onRecordDelete = (event: DbRecordDeleteEvent) => {
    console.log("local record delete", event);
    this.notify(DbEventType.DELETE, event);
  };

  private onRemoteRecordAdd = (event: DbRecordSaveEvent) => {
    console.log("remote record add", event);
    this.getDb(event.db).then((db) => db.add(event.collection, event.record));
  };

  private onRemoteRecordPut = (event: DbRecordSaveEvent) => {
    console.log("remote record put", event);
    this.getDb(event.db).then((db) => db.put(event.collection, event.record));
  };

  private onRemoteRecordDelete = (event: DbRecordDeleteEvent) => {
    console.log("remote record delete", event);
    this.getDb(event.db).then((db) => db.delete(event.collection, event.key));
  };

  private onRemoteConnect = () => {
    console.log("Connection detected");
    this.call(RemoteDbEventType.SCHEMA).then(this.onRemoteSchema);
  };

  private onRemoteSchema = (schema: DbSchema[], ignoreSync?: boolean) => {
    localStorage.setItem(WS_DB_SCHEMA, JSON.stringify(schema));
    console.log("got schema", schema, "ignore sync?", ignoreSync);
    const dbs: ObservableDb[] = schema.map(this.createLocalDb);
    if (!ignoreSync) {
      dbs.forEach(this.callSync);
    }
    return dbs;
  };

  private createLocalDb = (schema: DbSchema): ObservableDb => {
    const db = new ObservableDb(schema);
    db.on(DbEventType.ADD, this.onRecordAdd);
    db.on(DbEventType.PUT, this.onRecordPut);
    db.on(DbEventType.DELETE, this.onRecordDelete);
    return db;
  };

  private callSync = (db: ObservableDb) => {
    console.log("calling sync on all dbs");
    for (const col of db.getSchema().collections) {
      console.log("calling sync on ", db.getSchema().name, col);
      db.getAll(col.name).then((all: any[]) => {
        const lastUpdatedAt =
          all && all.length > 0
            ? all.sort((a, b) => b["updated_at"] - a["updated_at"]).pop()
                .updated_at
            : undefined;
        const event: RemoteDbSyncParams = {
          collection: col.name,
          db: db.getSchema().name,
          lastUpdatedAt: lastUpdatedAt,
        };
        this.notify(RemoteDbEventType.SYNC, event);
      });
    }
  };

  constructor(addess: string, protocols?: string | string[]) {
    super(addess, protocols);
    this.on(DbEventType.ADD, this.onRemoteRecordAdd);
    this.on(DbEventType.PUT, this.onRemoteRecordPut);
    this.on(DbEventType.DELETE, this.onRemoteRecordDelete);
    this.on(WebSocketEventType.CONNECT, this.onRemoteConnect);
    const localSchemaText = localStorage.getItem(WS_DB_SCHEMA);
    if (localSchemaText) {
      this.schemas = JSON.parse(localSchemaText);
      console.log("Found local schema, creating local dbs.");
      this.dbs = Promise.resolve(this.schemas.map(this.createLocalDb));
    } else {
      console.log("No local dbs found, requesting remote schema.");
      this.dbs = this.call(
        RemoteDbEventType.SCHEMA
      ).then((schema: DbSchema[]) => this.onRemoteSchema(schema, true));
    }
  }

  getDb(name: string): Promise<ObservableDb> {
    return this.dbs.then((dbs) => dbs.find((d) => d.getSchema().name === name));
  }
}
