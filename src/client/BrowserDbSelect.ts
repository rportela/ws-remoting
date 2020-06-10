import { DbSelect } from "../common/DbSelect";
import BrowserDb from "./BrowserDb";

export default class BrowserDbSelect<T> extends DbSelect<T> {
  private db: BrowserDb;

  constructor(db: BrowserDb, collection: string) {
    super(collection);
    this.db = db;
  }

  private getRecords(): Promise<any[]> {
    const recs: T[] = [];
    return this.applyFilter((rec) => recs.push(rec)).then(() => recs);
  }

  applyFilter(fn: (record: T) => void): Promise<void> {
    return this.db.forEach(this._from, (cursor: IDBCursorWithValue) => {
      if (this._where) {
        if (this._where.filterRecord(cursor.value)) fn(cursor.value);
      } else fn(cursor.value);
      cursor.continue();
    });
  }

  count(): Promise<number> {
    let counter = 0;
    return this.applyFilter(() => counter++).then(() => counter);
  }
  first(): Promise<T> {
    return this.all().then((recs) =>
      recs && recs.length > 0 ? recs[0] : undefined
    );
  }
  all(): Promise<T[]> {
    return this.getRecords().then((recs: any[]) => {
      if (this._orderBy) this._orderBy.sort(recs);
      if (this._offset) {
        if (this._limit) return recs.slice(this._offset, this._limit);
        else return recs.slice(this._offset);
      } else if (this._limit) {
        return recs.slice(0, this._limit);
      } else {
        return recs;
      }
    });
  }
  forEach(fn: (param: T) => any): Promise<void> {
    return this.all().then((recs) => recs.forEach(fn));
  }
}
