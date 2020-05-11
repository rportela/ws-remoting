import DbSchema from "./DbSchema";

export const DbActions = {
  INSERTED: "INSERTED",
  UPDATED: "UPDATED",
  DELETED: "DELETED",
};

export type DbQuery =
  | string
  | number
  | Date
  | ArrayBufferView
  | ArrayBuffer
  | IDBArrayKey
  | IDBKeyRange;

export interface Db {
  getSchema(): DbSchema;
  add(collection: string, record: any): Promise<IDBValidKey>;
  put(collection: string, record: any): Promise<IDBValidKey>;
  delete(collection: string, id: string): Promise<string>;
  query(collection: string, query: DbQuery): Promise<any[]>;
  get(collection: string, query: DbQuery): Promise<any>;
}
