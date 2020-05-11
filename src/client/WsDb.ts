import ClientDb from "./ClientDb";
import { WsClient, WsClientAction } from "./WsClient";
import { Db, DbQuery, DbActions } from "../common/Db";
import WsDbActions from "../common/WsDbActions";
import WsDbSaveParams from "../common/WsDbSaveParams";
import WsDbDeleteParams from "../common/WsDbDeleteParams";
import DbSchema from "../common/DbSchema";

export default class WsDb implements Db {
  private db: ClientDb;
  private socket: WsClient;
  private messagedb: ClientDb;
  private opening: Promise<ClientDb>;

  constructor(url: string, db: string) {
    this.socket = new WsClient(url);
    this.socket.addListener(WsClientAction.CONNECT, this._sync);
    this.socket.addListener(WsClientAction.ERROR, this._dispatchErrors);
    this.socket.addListener(WsDbActions.DELETED, this._onRecordDeleted);
    this.socket.addListener(WsDbActions.INSERTED, this._onRecordInserted);
    this.socket.addListener(WsDbActions.UPDATED, this._onRecordUpdated);
    this.opening = this.socket
      .call(WsDbActions.SCHEMA, db)
      .then(this._receiveSchema);
  }

  private _onRecordInserted = (params: WsDbSaveParams) => {
    console.log("got a record inserted");
    const schema = this.getSchema();
    if (params.db === schema.name) {
      console.log("attempting to add a new record.");
      this.db.add(params.name, params.record).catch((reason: any) => {
        console.error(reason);
        this.db.notifyListener(params.name, DbActions.INSERTED, params.record);
      });
    }
  };

  private _onRecordUpdated = (params: WsDbSaveParams) => {
    const schema = this.getSchema();
    if (params.db === schema.name) {
      this.db.put(params.name, params.record);
    }
  };

  private _onRecordDeleted = (params: WsDbDeleteParams) => {
    const schema = this.getSchema();
    if (params.db === schema.name) {
      this.db.delete(params.name, params.key);
    }
  };

  private _receiveSchema = (schema: DbSchema) => {
    this.db = new ClientDb(schema);
    this.messagedb = new ClientDb({
      name: "messagedb",
      version: 1,
      collections: [{ name: "messages", keyPath: "id", autoIncrement: true }],
    });
    return this.db;
  };

  private _sync = () => {
    if (this.messagedb) {
      this.messagedb.query("messages").then((messages) => {
        for (const message of messages)
          this.socket
            .call(message.action, message.params)
            .then(() => this.messagedb.delete("messages", message.id));
      });
    }
  };

  private _dispatchErrors = (error) => {
    console.error(error);
  };

  private _notify(message: { action: string; params: any }): Promise<any> {
    return this.messagedb
      .add("messages", message)
      .then((id: any) =>
        this.socket
          .call(message.action, message.params)
          .then((result) =>
            this.messagedb.delete("messages", id).then(() => result)
          )
      );
  }

  /**
   *
   */
  createId(): string {
    return new Date().getTime().toString(36) + "_" + Math.random().toString(36);
  }

  /**
   *
   */
  getSchema(): DbSchema {
    return this.db ? this.db.getSchema() : null;
  }

  /**
   *
   * @param collection
   * @param record
   */
  add(collection: string, record: any): Promise<IDBValidKey> {
    record.id = this.createId();
    record.createAt = new Date();
    record.updatedAt = new Date();
    return this.opening.then((db) =>
      db.add(collection, record).then((id) => {
        this._notify({
          action: WsDbActions.INSERTED,
          params: {
            db: this.getSchema().name,
            name: collection,
            record: record,
          },
        });
        return id;
      })
    );
  }

  /**
   *
   * @param collection
   * @param record
   */
  put(collection: string, record: any): Promise<IDBValidKey> {
    record.updatedAt = new Date();
    return this.opening.then((db) =>
      db.put(collection, record).then((id) => {
        this._notify({
          action: WsDbActions.UPDATED,
          params: {
            db: this.getSchema().name,
            name: collection,
            record: record,
          },
        });
        return id;
      })
    );
  }

  /**
   *
   * @param collection
   * @param id
   */
  delete(collection: string, id: string): Promise<string> {
    return this.opening.then((db) =>
      db.delete(collection, id).then((id) => {
        this._notify({
          action: WsDbActions.DELETED,
          params: {
            db: this.getSchema().name,
            name: collection,
            key: id,
          },
        });
        return id;
      })
    );
  }

  /**
   *
   * @param collection
   * @param query
   */
  query(collection: string, query: DbQuery): Promise<any[]> {
    return this.opening.then((db) => db.query(collection, query));
  }

  /**
   *
   * @param collection
   * @param query
   */
  get(collection: string, query: DbQuery): Promise<any> {
    return this.opening.then((db) => db.get(collection, query));
  }

  /**
   *
   * @param collection
   * @param key
   * @param listener
   */
  addListener(collection: string, key: string, listener: (...params) => any) {
    return this.opening.then((db) => {
      db.addListener(collection, key, listener);
    });
  }

  /**
   *
   * @param collection
   * @param key
   * @param listener
   */
  removeListener(
    collection: string,
    key: string,
    listener: (...params) => any
  ) {
    return this.opening.then((db) =>
      db.removeListener(collection, key, listener)
    );
  }
}
