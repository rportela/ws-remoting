import { Db, DbActions, DbQuery } from "../common/Db";
import DbSchema from "../common/DbSchema";
import Dispatcher from "../common/Dispatcher";
import WsDbActions from "../common/WsDbActions";

/**
 * This class wraps a local indexedb and exposes method to allow syncing and adding;
 *
 * @author Rodrigo Portela
 */
export default class ClientDb implements Db {
  private db: IDBDatabase;
  private opening: Promise<ClientDb>;
  private schema: DbSchema;
  private listeners: any;

  /**
   * This method performs the upgrade of the database with a new schema.
   */
  private _upgrade = (event: IDBVersionChangeEvent) => {
    const target: any = event.target;
    const db: IDBDatabase = target.result;
    for (const col of this.schema.collections) {
      if (db.objectStoreNames.contains(col.name)) {
        db.deleteObjectStore(col.name);
      }
      const store = db.createObjectStore(col.name, {
        keyPath: col.keyPath,
        autoIncrement: col.autoIncrement,
      });
      if (col.indexes) {
        for (const idx of col.indexes)
          store.createIndex(idx.property, idx.property, { unique: idx.unique });
      }
    }
  };

  /**
   * This method constructs a client db with a specific schema;
   *
   * @param schema
   */
  constructor(schema: DbSchema) {
    this.schema = schema;
    this.listeners = {};
    for (const col of schema.collections) {
      this.listeners[col.name] = new Dispatcher();
    }
    this.opening = new Promise((resolve, reject) => {
      const req = indexedDB.open(schema.name, schema.version);
      req.onsuccess = () => {
        this.db = req.result;
        resolve(this);
      };
      req.onerror = () => reject(req.error);
      req.onupgradeneeded = this._upgrade;
      req.onblocked = () =>
        reject(new Error("Blocked, you should probably refresh your browser"));
    });
  }

  /**
   *
   * @param collection
   * @param record
   */
  public add(collection: string, record: any, key?: IDBValidKey) {
    return this.opening.then(
      () =>
        new Promise<IDBValidKey>((resolve, reject) => {
          const req = this.db
            .transaction(collection, "readwrite")
            .objectStore(collection)
            .add(record, key);
          req.onerror = () => reject(req.error);
          req.onsuccess = () => {
            this.notifyListener(collection, DbActions.INSERTED, record);
            resolve(req.result);
          };
        })
    );
  }

  /**
   *
   * @param collection
   * @param record
   */
  public put(collection: string, record: any, key?: IDBValidKey) {
    return this.opening.then(
      () =>
        new Promise<IDBValidKey>((resolve, reject) => {
          const req = this.db
            .transaction(collection, "readwrite")
            .objectStore(collection)
            .put(record, key);
          req.onerror = () => reject(req.error);
          req.onsuccess = () => {
            this.notifyListener(collection, record.id, record);
            resolve(req.result);
          };
        })
    );
  }

  /**
   *
   * @param collection
   * @param id
   */
  delete(collection: string, id: string): Promise<string> {
    return this.opening.then(
      () =>
        new Promise<string>((resolve, reject) => {
          const req = this.db
            .transaction(collection, "readwrite")
            .objectStore(collection)
            .delete(id);
          req.onerror = () => reject(req.error);
          req.onsuccess = () => {
            this.notifyListener(collection, DbActions.DELETED, id);
            resolve(id);
          };
        })
    );
  }

  /**
   *
   */
  getSchema(): DbSchema {
    return this.schema;
  }

  /**
   *
   */
  get(collection: string, query: DbQuery) {
    return this.opening.then(
      () =>
        new Promise((resolve, reject) => {
          const req = this.db
            .transaction(collection)
            .objectStore(collection)
            .get(query);
          req.onsuccess = () => resolve(req.result);
          req.onerror = () => reject(req.error);
        })
    );
  }

  /**
   *
   * @param collection
   * @param query
   * @param direction
   */
  query(
    collection: string,
    query?: DbQuery,
    direction?: IDBCursorDirection
  ): Promise<any[]> {
    return this.opening.then(
      () =>
        new Promise<any[]>((resolve, reject) => {
          const req = this.db
            .transaction(collection)
            .objectStore(collection)
            .openCursor(query, direction);
          const list: any[] = [];
          req.onerror = () => reject(req.error);
          req.onsuccess = () => {
            if (req.result) {
              list.push(req.result.value);
              req.result.continue();
            } else {
              resolve(list);
            }
          };
        })
    );
  }

  addListener(
    collection: string,
    key: string,
    listener: (params: any) => void
  ) {
    const dispatch: Dispatcher = this.listeners[collection];
    dispatch.register(key, listener);
  }

  removeListener(
    collection: string,
    key: string,
    listener: (params: any) => void
  ) {
    const dispatch: Dispatcher = this.listeners[collection];
    dispatch.unregister(key, listener);
  }

  notifyListener(collection: string, key: string, params: any) {
    const dispatch: Dispatcher = this.listeners[collection];
    if (dispatch) dispatch.dispatch(key, params);
    else console.log("ops, null dispatchers for ", collection, key);
  }
}
