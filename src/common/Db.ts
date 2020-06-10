import { DbSelect } from "./DbSelect";
import { DbRecordSaveEvent, DbRecordDeleteEvent } from "./DbEvents";

/**
 * This file contains important definitions for databases written in this framework either on the server or on the client.
 * It is not supposed to include any implementation, just the definitions that will be followed by their respective code.
 * Also, it should not be dependent on anything else.
 * Please read this carefully and add relevant comments if necessary.
 *
 * @author Rodrigo Portela
 */

/**
 * Currently available database key types. We can support composite key arrays in the future if necessary.
 * However, understand that we support composite keys on indexes.
 * And single identity columns are advised by most DBAs.
 *
 *  * @author Rodrigo Portela.
 */
export type DbKey = string | number;

/**
 * This interface wraps options for creating an index on the database.

 * @author Rodrigo Portela
 */
export interface DbSchemaIndex {
  /**
   * The name of the index.
   */
  name: string;
  /**
   * The key path of the index to be created.
   */
  keyPath: string | string[];
  /**
   * An indicator that the index is unique.
   */
  unique?: boolean;
}

/**
 * This interface wraps options for creating a collection on the database.

 * @author Rodrigo Portela
 */
export interface DbSchemaCollection {
  /**
   * The name of the collection or object store.
   */
  name: string;
  /**
   * The key path to locate objects.
   */
  keyPath?: string;
  /**
   * An indicator that the key Path should auto Increment itself.
   */
  autoIncrement?: boolean;
  /**
   * None or more indexes to be created on the object store.
   */
  indexes?: DbSchemaIndex[];
}

/**
 * This is the definition of the schema of the database.
 * It can either be declared on json or read from a real database instance.
 */
export interface DbSchema {
  /**
   * The name of the database.
   */
  name: string;
  /**
   * The version number of the schema or 1 if none is provided.
   */
  version?: number;
  /**
   * An array of collections that should be created on the database.
   */
  collections: DbSchemaCollection[];
}

export interface Db {
  getSchema(): DbSchema;
  select<T>(collection: string): DbSelect<T>;
  add(collection: string, record: any): Promise<DbRecordSaveEvent>;
  put(collection: string, record: any): Promise<DbRecordSaveEvent>;
  delete(collection: string, key: DbKey): Promise<DbRecordDeleteEvent>;
}

export function createId() {
  return new Date().getTime().toString(36) + "_" + Math.random().toString(36);
}
