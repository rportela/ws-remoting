/**
 * Wraps a sequence of order by expressions where you can define
 * a column name and a direction for the sort.
 * @author Rodrigo Portela
 */
export declare class DbOrderBy {
    name: string;
    descending: boolean;
    next?: DbOrderBy;
    constructor(name: string, descending?: boolean);
    createComparer(): (a: any, b: any) => 0 | 1 | -1;
    sort(arr: any[]): void;
}
