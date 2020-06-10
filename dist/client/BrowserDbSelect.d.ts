import { DbSelect } from "../common/DbSelect";
import BrowserDb from "./BrowserDb";
export default class BrowserDbSelect<T> extends DbSelect<T> {
    private db;
    constructor(db: BrowserDb, collection: string);
    private getRecords;
    applyFilter(fn: (record: T) => void): Promise<void>;
    count(): Promise<number>;
    first(): Promise<T>;
    all(): Promise<T[]>;
    forEach(fn: (param: T) => any): Promise<void>;
}
