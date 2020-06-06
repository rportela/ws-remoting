import { Db, DbCollectionDropEvent, DbDatabaseDropEvent, DbEventType, DbKey, DbRecordDeleteEvent, DbRecordSaveEvent, DbSchema, DbSchemaCollection, DbSelect, NaiveDbSelect } from "../common/Db";
import EventEmitter from "../common/EventEmitter";

/**
 * Wraps indexed db functionality with promises for a better developer experience.
 * And it has an event emmiter attached to it so every operation can be observed from
 * the UI or any other listener.
 *
 * @author Rodrigo Portela
 */
export default class ObservableDb implements Db {
  private schema: DbSchema;
  private open: Promise<IDBDatabase>;
  private emitter: EventEmitter;

  /**
   * Destroys every previos object store and creates new ones based on schema.
   * IMPORTANT: all data is deleted from the database.
   */
  private onUpgradeNeeded = (event: IDBVersionChangeEvent) => {
    const target: any = event.target;
    const db: IDBDatabase = target.result;
    for (const name of db.objectStoreNames) db.deleteObjectStore(name);
    this.schema.collections.forEach((col: DbSchemaCollection) => {
      const store = db.createObjectStore(col.name, {
        keyPath: col.keyPath,
        autoIncrement: col.autoIncrement,
      });
      if (col.indexes) {
        for (const idx of col.indexes) {
          store.createIndex(idx.name, idx.keyPath, { unique: idx.unique });
        }
      }
    });
    this.emitter.emit(DbEventType.UPGRADED, this);
  };

  /**
   * Construcs an IDB with a promise that it will either open or a rejection will happen.
   *
   * @param schema
   */
  constructor(schema: DbSchema) {
    this.schema = schema;
    this.emitter = new EventEmitter();
    this.open = new Promise((resolve, reject) => {
      const req = indexedDB.open(schema.name, schema.version);
      req.onerror = () => {
        reject(req.error);
        this.emitter.emit(DbEventType.ERROR, req.error);
      };
      req.onsuccess = () => {
        resolve(req.result);
        this.emitter.emit(DbEventType.OPEN, this);
      };
      req.onupgradeneeded = this.onUpgradeNeeded;
      req.onblocked = () => {
        const err = new Error(
          "The database is blocked. You should probably refresh your browser."
        );
        reject(err);
        this.emitter.emit(DbEventType.ERROR, err);
      };
    });
  }

  /**
   * Creates time incremental unique ids.
   */
  static createId(): string {
    return new Date().getTime().toString(36) + "_" + Math.random().toString(36);
  }

  /**
   * Attaches a listener to a specific event.
   * @param event
   * @param listener
   */
  on(event: DbEventType, listener: (params: any) => void) {
    this.emitter.on(event, listener);
  }

  /**
   * Detaches a listener from a specific event.
   * @param event
   * @param listener
   */
  off(event: DbEventType, listener: (params: any) => void) {
    this.emitter.off(event, listener);
  }

  /**
   * Drops a collection and emits the corresponding event.
   *
   * @param collection
   */
  dropCollection(collection: string): Promise<DbCollectionDropEvent> {
    return this.open.then((db) => {
      db.deleteObjectStore(collection);
      const event: DbCollectionDropEvent = {
        db: this.schema.name,
        collection: collection,
      };
      this.emitter.emit(DbEventType.DROP_COLLECTION, event);
      return event;
    });
  }

  /**
   * Closes, drops the entire database and emmits the corresponding event.
   */
  drop(): Promise<DbDatabaseDropEvent> {
    return this.open.then(
      (db) =>
        new Promise((resolve, reject) => {
          try {
            db.onclose = () => {
              const event: DbDatabaseDropEvent = {
                db: this.schema.name,
              };
              indexedDB.deleteDatabase(this.schema.name);
              resolve(event);
              this.emitter.emit(DbEventType.DROP_DATABASE, event);
            };
            db.close();
          } catch (err) {
            reject(err);
          }
        })
    );
  }

  /**
   * Gets the current schema of the database.
   */
  getSchema(): DbSchema {
    return this.schema;
  }

  /**
   * Gets a specific member of a collection by it's key.
   *
   * @param collection
   * @param key
   */
  get(collection: string, key: DbKey): Promise<any> {
    return this.open.then(
      (db) =>
        new Promise((resolve, reject) => {
          const req = db
            .transaction(collection)
            .objectStore(collection)
            .get(key);
          req.onsuccess = () => resolve(req.result);
          req.onerror = () => reject(req.error);
        })
    );
  }

  /**
   * Gets all members of a collection.
   *
   * @param collection
   */
  all(collection: string): Promise<any[]> {
    return this.open.then(
      (db) =>
        new Promise((resolve, reject) => {
          const req = db
            .transaction(collection)
            .objectStore(collection)
            .getAll();
          req.onsuccess = () => resolve(req.result);
          req.onerror = () => reject(req.error);
        })
    );
  }

  /**
   * Creates a select object for a specific collection.
   *
   * @param collection
   */
  select<T>(collection: string): DbSelect<T> {
    return new NaiveDbSelect(this, collection);
  }

  /**
   * Adds or updates a record in store with the given value and key.
   * If the store uses in-line keys and key is specified a "DataError" DOMException will be thrown.
   * If put() is used, any existing record with the key will be replaced.
   * If add() is used, and if a record with the key already exists the request will fail, with request's error set to a "ConstraintError" DOMException.
   * If successful, request's result will be the record's key.
   * The corresponding event will be emited.
   *
   * @param collection
   * @param record
   */
  add(collection: string, record: any): Promise<DbRecordSaveEvent> {
    return this.open.then(
      (db) =>
        new Promise((resolve, reject) => {
          const store = db
            .transaction(collection, "readwrite")
            .objectStore(collection);
          const req = store.add(record);
          req.onsuccess = () => {
            const key: any = req.result;
            const event: DbRecordSaveEvent = {
              db: this.schema.name,
              collection: collection,
              key: key,
              keyPath: store.keyPath,
              record: record,
            };
            resolve(event);
            this.emitter.emit(DbEventType.ADD, event);
          };
          req.onerror = () => reject(req.error);
        })
    );
  }

  /**
   * Adds or updates a record in store with the given value and key.
   * If the store uses in-line keys and key is specified a "DataError" DOMException will be thrown.
   * If put() is used, any existing record with the key will be replaced.
   * If add() is used, and if a record with the key already exists the request will fail, with request's error set to a "ConstraintError" DOMException.
   * If successful, request's result will be the record's key.
   * The corresponding event will be emited.
   *
   * @param collection
   * @param record
   */
  put(collection: string, record: any): Promise<DbRecordSaveEvent> {
    return this.open.then(
      (db) =>
        new Promise((resolve, reject) => {
          const store = db
            .transaction(collection, "readwrite")
            .objectStore(collection);
          const req = store.put(record);
          req.onsuccess = () => {
            const key: any = req.result;
            const event: DbRecordSaveEvent = {
              db: this.schema.name,
              collection: collection,
              key: key,
              keyPath: store.keyPath,
              record: record,
            };
            resolve(event);
            this.emitter.emit(DbEventType.PUT, event);
          };
          req.onerror = () => reject(req.error);
        })
    );
  }

  /**
   * Deletes records in store with the given key or in the given key range in query.
   * If successful, request's result will be undefined.
   * And the corresponding event will be emited.
   *
   * @param collection
   * @param key
   */
  delete(collection: string, key: DbKey): Promise<DbRecordDeleteEvent> {
    return this.open.then(
      (db) =>
        new Promise((resolve, reject) => {
          const store = db
            .transaction(collection, "readwrite")
            .objectStore(collection);
          const req = store.delete(key);
          req.onsuccess = () => {
            const event: DbRecordDeleteEvent = {
              db: this.schema.name,
              collection: collection,
              keyPath: store.keyPath,
              key: key,
            };
            resolve(event);
            this.emitter.emit(DbEventType.DELETE, event);
          };
          req.onerror = () => reject(req.error);
        })
    );
  }

  close(): Promise<void> {
    return this.open.then(
      (db) =>
        new Promise((resolve, reject) => {
          db.onclose = () => resolve();
          try {
            db.close();
          } catch (err) {
            reject(err);
          }
        })
    );
  }
}
