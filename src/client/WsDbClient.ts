import { DbEventType, DbRecordDeleteEvent, DbRecordSaveEvent, DbSchema } from "../common/Db";
import { WsDbEventType, WsDbSyncParams } from "../common/WsDb";
import JsonRpcClient from "./JsonRpcClient";
import ObservableDb from "./ObservableDb";
import { ClientSocketEventType } from "./WebSocketClient";
const WS_DB_SCHEMA = "WS_DB_SCHEMA";

export default class WsDbClient extends JsonRpcClient {
  private schemas: DbSchema[];
  private dbs: ObservableDb[];

  private onRecordAdd = (event: DbRecordSaveEvent) => {
    this.notify(WsDbEventType.ADD, event);
  };

  private onRecordPut = (event: DbRecordSaveEvent) => {
    this.notify(DbEventType.PUT, event);
  };

  private onRecordDelete = (event: DbRecordDeleteEvent) => {
    this.notify(DbEventType.DELETE, event);
  };

  private onRemoteRecordAdd = (event: DbRecordSaveEvent) => {
    const db = this.getDb(event.db);
    if (db) db.add(event.collection, event.record);
  };

  private onRemoteRecordPut = (event: DbRecordSaveEvent) => {
    const db = this.getDb(event.db);
    if (db) db.put(event.collection, event.record);
  };

  private onRemoteRecordDelete = (event: DbRecordDeleteEvent) => {
    const db = this.getDb(event.db);
    if (db) db.delete(event.collection, event.key);
  };

  private createLocalDb = (schema: DbSchema): ObservableDb => {
    const db = new ObservableDb(schema);
    db.on(DbEventType.ADD, this.onRecordAdd);
    db.on(DbEventType.PUT, this.onRecordPut);
    db.on(DbEventType.DELETE, this.onRecordDelete);
    return db;
  };

  private closeLocalDb(db: ObservableDb): Promise<void> {
    db.off(DbEventType.ADD, this.onRecordAdd);
    db.off(DbEventType.PUT, this.onRecordPut);
    db.off(DbEventType.DELETE, this.onRecordDelete);
    return db.close();
  }

  private loadLocalDbs() {
    const localSchemaText = localStorage.getItem(WS_DB_SCHEMA);
    if (localSchemaText) {
      this.schemas = JSON.parse(localSchemaText);
      this.dbs = this.schemas.map(this.createLocalDb);
      this.onDbAvailable(this);
    }
  }

  private callSync = (db: ObservableDb) => {
    for (const col of db.getSchema().collections) {
      db.all(col.name).then((all: any[]) => {
        const lastUpdatedAt =
          all && all.length > 0
            ? all.sort((a, b) => b["updated_at"] - a["updated_at"]).pop()
                .updated_at
            : undefined;
        const event: WsDbSyncParams = {
          collection: col.name,
          db: db.getSchema().name,
          lastUpdatedAt: lastUpdatedAt,
        };
        this.notify(WsDbEventType.SYNC, event);
      });
    }
    return;
  };

  private refreshLocalDbs = (): Promise<any> => {
    return this.call(WsDbEventType.SCHEMA)
      .then((schemas: DbSchema[]) => {
        localStorage.setItem(WS_DB_SCHEMA, JSON.stringify(schemas));
        return this.dbs
          ? Promise.all(this.dbs.map(this.closeLocalDb)).then(() => schemas)
          : Promise.resolve(schemas);
      })
      .then((schemas: DbSchema[]) => {
        this.dbs = schemas.map(this.createLocalDb);
        this.dbs.forEach(this.callSync);
        this.onDbAvailable(this);
      });
  };

  constructor(addess: string, protocols?: string | string[]) {
    super(addess, protocols);
    this.loadLocalDbs();
    this.setHandler(DbEventType.ADD, this.onRemoteRecordAdd);
    this.setHandler(DbEventType.PUT, this.onRemoteRecordPut);
    this.setHandler(DbEventType.DELETE, this.onRemoteRecordDelete);
    this.setHandler(ClientSocketEventType.CONNECT, this.refreshLocalDbs);
  }
  onDbAvailable = (wsdb: WsDbClient) => void {};

  getDb(name: string): ObservableDb {
    return this.dbs ? this.dbs.find((d) => d.getSchema().name === name) : null;
  }
}
