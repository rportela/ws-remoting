/**
 * Wraps a sequence of order by expressions where you can define
 * a column name and a direction for the sort.
 * @author Rodrigo Portela
 */
export interface DbOrderByGetter {
    (record: any): any;
}
export declare class DbOrderBy {
    getter: DbOrderByGetter;
    descending: boolean;
    next?: DbOrderBy;
    constructor(getter: string | DbOrderByGetter, descending?: boolean);
    createComparer(): (a: any, b: any) => 1 | 0 | -1;
    sort(arr: any[]): void;
}
