import { Db, DbKey, DbSchema } from "./Db";
import { DbSelect } from "./DbSelect";
import { DbCollectionClearEvent, DbDatabaseDropEvent } from "./DbEvents";

export class MemoryDb implements Db {
  private schema: DbSchema;
  private records: any;
  constructor(schema: DbSchema) {
    this.schema = schema;
    this.records = {};
    for (let col of schema.collections) {
      this.records[col.name] = [];
    }
  }

  getSchema(): DbSchema {
    return this.schema;
  }
  get(collection: string, key: DbKey): Promise<any> {
    const col = this.schema.collections.find((c) => c.name === collection);
    return col
      ? this.records[col.name].find((r) => r[col.keyPath.toString()] === key)
      : null;
  }
  getAll(collection: string): Promise<any[]> {
    return Promise.resolve(this.records[collection]);
  }
  select<T>(collection: string): DbSelect<T> {
    return new MemoryDbSelect(this, collection);
  }
  add(collection: string, record: any): Promise<any> {
    this.records[collection].push(record);
    return Promise.resolve(this.records.length);
  }
  put(collection: string, record: any): Promise<any> {
    const col = this.schema.collections.find((c) => c.name === collection);
    const oldindex = col
      ? this.records[col.name].findIndex(
          (r) => r[col.keyPath.toString()] === record[col.keyPath.toString()]
        )
      : -1;
    if (oldindex >= 0) {
      this.records[col.name][oldindex] = record;
      return Promise.resolve(oldindex);
    } else return this.add(collection, record);
  }
  delete(collection: string, key: DbKey): Promise<any> {
    throw new Error("Method not implemented.");
  }
  clear(collection: string): Promise<DbCollectionClearEvent> {
    this.records[collection] = {};
    return Promise.resolve({
      db: this.schema.name,
      collection: collection,
    });
  }
  drop(): Promise<DbDatabaseDropEvent> {
    for (const col of this.schema.collections) delete this.records[col.name];
    return Promise.resolve({
      db: this.schema.name,
    });
  }
}

export class MemoryDbSelect<T> extends DbSelect<T> {
  db: MemoryDb;

  constructor(db: MemoryDb, collection: string) {
    super(collection);
    this.db = db;
  }

  count(): Promise<number> {
    return this.all().then((arr) => arr.length);
  }
  first(): Promise<T> {
    return this.all().then((arr) => (arr.length > 0 ? arr[0] : undefined));
  }
  all(): Promise<T[]> {
    return this.db.getAll(this._from).then((recs: any[]) => {
      if (this._where) recs = recs.filter(this._where.filterRecord);
      if (recs.length === 0) return recs;
      if (this._orderBy) this._orderBy.sort(recs);
      const start = this._offset || 0;
      const end = Math.min(this._offset + this._limit, recs.length);
      if (start) {
        return end ? recs.slice(start, end) : recs.slice(start, recs.length);
      } else if (end) {
        return recs.slice(0, end);
      } else return recs;
    });
  }
  forEach(fn: (param: T) => any): Promise<void> {
    return this.all().then((recs) => recs.forEach(fn));
  }
}
