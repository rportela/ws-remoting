import {
  DbDeleteEvent,
  DbEvent,
  DbFilterComparison,
  DbFilterTerm,
  DbSaveEvent,
  DbSchema,
  DbSchemaCollection,
} from "../common/Db";
import { WsDbEvent, WsDbQueryParams } from "../common/WsDb";
import BrowserDb from "./BrowserDb";
import { ObservableDb } from "./ObservableDb";
import { WsClient, WsClientAction } from "./WsClient";

export default class WsDbClient {
  private socket: WsClient;
  private messagedb: BrowserDb;
  private opening: Promise<ObservableDb[]>;

  constructor(url: string) {
    this.socket = new WsClient(url);
    this.socket.addListener(WsClientAction.CONNECT, this.onConnect);
    this.socket.addListener(WsClientAction.ERROR, this.onError);
    this.socket.addListener(WsDbEvent.DELETED, this.onServerDelete);
    this.socket.addListener(WsDbEvent.INSERTED, this.onServerInsert);
    this.socket.addListener(WsDbEvent.UPDATED, this.onServerUpdate);
    this.opening = this.socket.call(WsDbEvent.SCHEMA, null).then(this.onSchema);
    this.messagedb = new BrowserDb({
      name: "messagedb",
      version: 1,
      collections: [{ name: "message", keyPath: "id", autoIncrement: true }],
    });
  }

  private notifyServer(action: string, params: any): any {
    this.messagedb
      .add("message", {
        action: action,
        params: params,
      })
      .then((key: any) => {
        this.socket.call(action, params).then((res: any) => {
          this.messagedb.delete("message", key);
          return res;
        });
      });
  }

  private onConnect = () => {
    this.messagedb.all("message").then((message: any[]) =>
      message.forEach((message) => {
        this.socket
          .call(message.action, message.params)
          .then(() => this.messagedb.delete("message", message.id));
      })
    );
    this.opening.then((dbs) => dbs.forEach(this.fetchDbRecords));
  };

  private fetchDbRecords = (db: ObservableDb): void => {
    db.getSchema().collections.forEach((col) =>
      this.fetchCollectionRecords(db, col)
    );
  };

  private fetchCollectionRecords(
    db: ObservableDb,
    collection: DbSchemaCollection
  ) {
    db.select(collection.name)
      .orderBy("updated_at", true)
      .first()
      .then((last: any) => {
        const query: WsDbQueryParams = {
          db: db.getSchema().name,
          collection: collection.name,
          where: last
            ? new DbFilterTerm(
                "updated_at",
                DbFilterComparison.GREATER_THAN,
                last.updated_at
              )
            : undefined,
        };
        this.socket.call(WsDbEvent.QUERY, query).then((results: any[]) => {
          if (results && results.forEach)
            results.forEach((result) =>
              db.upsert(collection.name, result, true)
            );
        });
      });
  }

  private onError = (err: Error) => {
    console.error(err);
  };

  private onServerDelete = (params: DbDeleteEvent) => {
    this.getDb(params.db).then((db) =>
      db.delete(params.collection, params.key).catch((err: Error) => {
        console.error(err);
        db.notifyListeners(params.collection, DbEvent.DELETED, params.key);
      })
    );
  };

  private onServerInsert = (params: DbSaveEvent) => {
    this.getDb(params.db).then((db) =>
      db.insert(params.collection, params.record).catch((err: Error) => {
        console.error(err);
        db.notifyListeners(params.collection, DbEvent.INSERTED, params.record);
      })
    );
  };

  private onServerUpdate = (params: DbSaveEvent) => {
    this.getDb(params.db).then((db) =>
      db.update(params.collection, params.record).catch((err: Error) => {
        console.error(err);
        db.notifyListeners(params.collection, DbEvent.UPDATED, params.record);
      })
    );
  };

  private onClientDelete = (params: DbDeleteEvent) => {
    this.notifyServer(WsDbEvent.DELETED, params);
  };

  private onClientInsert = (params: DbSaveEvent) => {
    this.notifyServer(WsDbEvent.INSERTED, params);
  };

  private onClientUpdate = (params: DbSaveEvent) => {
    this.notifyServer(WsDbEvent.UPDATED, params);
  };

  private onSchema = (schema: DbSchema[]) =>
    schema.map((s: DbSchema) => {
      const db: ObservableDb = new ObservableDb(s);
      s.collections.forEach((col) => {
        db.addListener(col.name, DbEvent.DELETED, this.onClientDelete);
        db.addListener(col.name, DbEvent.INSERTED, this.onClientInsert);
        db.addListener(col.name, DbEvent.UPDATED, this.onClientUpdate);
      });
      return db;
    });

  getDb(name: string): Promise<ObservableDb> {
    return this.opening.then((dbs: ObservableDb[]) =>
      dbs.find((db) => db.getSchema().name == name)
    );
  }
}
