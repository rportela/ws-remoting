import {
  Db,
  DbSchemaCollection,
  DbKey,
  DbSelect,
  DbSchema,
  DbEvent,
  DbSaveEvent,
  DbDeleteEvent,
} from "../common/Db";
import BrowserDb from "./BrowserDb";
import Dispatcher from "../common/Dispatcher";

export class ObservableDbSelect<T> extends DbSelect<T> {
  db: BrowserDb;
  collection: string;
  constructor(db: BrowserDb, collection: string) {
    super();
    this.db = db;
    this.collection = collection;
  }

  first(): Promise<T> {
    return this.db.first(this.collection, this._where, this._order);
  }

  toArray(): Promise<T[]> {
    return this.db.query(
      this.collection,
      this._where,
      this._order,
      this._offset,
      this._limit
    );
  }
}

export class ObservableDb implements Db {
  db: BrowserDb;
  listeners: any;
  constructor(schema: DbSchema) {
    this.db = new BrowserDb(schema);
    this.listeners = {};
    schema.collections.forEach(
      (col) => (this.listeners[col.name] = new Dispatcher())
    );
  }

  createId(): string {
    return new Date().getTime().toString(36) + "_" + Math.random().toString(36);
  }

  /**
   *
   * @param collection
   * @param action
   * @param params
   */
  notifyListeners(collection: string, action: string, params: any) {
    const listener: Dispatcher = this.listeners[collection];
    if (listener) listener.dispatch(action, params);
  }

  /**
   *
   */
  getSchema(): DbSchema {
    return this.db.getSchema();
  }

  /**
   *
   * @param collection
   */
  getCollectionSchema(collection: string): DbSchemaCollection {
    return this.db.getSchema().collections.find((c) => c.name === collection);
  }

  /**
   *
   * @param collection
   */
  getCollectionKeyPath(collection: string): string | null {
    const colSchema = this.getCollectionSchema(collection);
    return colSchema ? colSchema.keyPath : null;
  }

  /**
   *
   * @param collection
   */
  select<T>(collection: string): DbSelect<T> {
    return new ObservableDbSelect(this.db, collection);
  }

  /**
   *
   * @param collection
   * @param record
   */
  insert<T>(
    collection: string,
    record: T,
    notify: boolean = true
  ): Promise<DbSaveEvent> {
    const keyPath = this.getCollectionKeyPath(collection);
    const event: DbSaveEvent = {
      db: this.getSchema().name,
      collection: collection,
      keyPath: keyPath,
      key: record[keyPath] || this.createId(),
      record: record,
    };

    record[event.keyPath] = event.key;
    record["created_at"] = new Date();
    record["updated_at"] = new Date();

    return this.db.add(collection, record).then(() => {
      if (notify) this.notifyListeners(collection, DbEvent.INSERTED, event);
      return event;
    });
  }

  /**
   *
   * @param collection
   * @param record
   */
  update<T>(
    collection: string,
    record: T,
    notify: boolean = true
  ): Promise<DbSaveEvent> {
    const keyPath = this.getCollectionKeyPath(collection);
    const event: DbSaveEvent = {
      db: this.getSchema().name,
      collection: collection,
      keyPath: keyPath,
      key: record[keyPath],
      record: record,
    };
    record["updated_at"] = new Date();
    return this.db.put(collection, record).then(() => {
      if (notify) this.notifyListeners(collection, DbEvent.UPDATED, event);
      return event;
    });
  }

  /**
   *
   * @param collection
   * @param record
   */
  upsert<T>(
    collection: string,
    record: T,
    notify: boolean = true
  ): Promise<DbSaveEvent> {
    const key = record[this.getCollectionKeyPath(collection)];
    return this.db
      .get(collection, key)
      .then((old: any) =>
        old
          ? this.update(collection, record, notify)
          : this.insert(collection, record, notify)
      );
  }

  /**
   *
   * @param collection
   * @param id
   */
  delete(
    collection: string,
    id: DbKey,
    notify: boolean = true
  ): Promise<DbDeleteEvent> {
    const event: DbDeleteEvent = {
      db: this.getSchema().name,
      collection: collection,
      keyPath: this.getCollectionKeyPath(collection),
      key: id,
    };
    return this.db.delete(collection, id).then(() => {
      if (notify) this.notifyListeners(collection, DbEvent.DELETED, event);
      return event;
    });
  }

  addListener(
    collection: string,
    key: string,
    listener: (params: any) => void
  ) {
    const dispacher: Dispatcher = this.listeners[collection];
    if (!dispacher)
      throw new Error(
        "Couldn't find an event dispatcher for collection: " + collection
      );
    else {
      dispacher.register(key, listener);
    }
  }

  removeListener(
    collection: string,
    key: string,
    listener: (params: any) => void
  ) {
    const dispatcher: Dispatcher = this.listeners[collection];
    if (dispatcher) dispatcher.unregister(key, listener);
  }
}
