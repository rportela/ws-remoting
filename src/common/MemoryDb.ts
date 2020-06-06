import {
  Db,
  DbSchema,
  DbKey,
  DbSelect,
  NaiveDbSelect,
  DbDatabaseDropEvent,
  DbCollectionDropEvent,
} from "./Db";

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
  all(collection: string): Promise<any[]> {
    return Promise.resolve(this.records[collection]);
  }
  select<T>(collection: string): DbSelect<T> {
    return new NaiveDbSelect(this, collection);
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
  dropCollection(collection: string): Promise<DbCollectionDropEvent> {
    delete this.records[collection];
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
