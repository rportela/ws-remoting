import { DbFilter, DbFilterExpression, DbFilterTerm } from "./DbFilters";
import { DbOrderBy } from "./DbSort";
/**
 * Interfaces a database select with configurable where clause,
 * orderBy clause, offset number and a limit of records.
 *
 * @author Rodrigo Portela
 */
export declare abstract class DbSelect<T> {
    _from: string;
    _where: DbFilter;
    _orderBy: DbOrderBy;
    _offset: number;
    _limit: number;
    constructor(from: string);
    where(filter: DbFilterTerm | DbFilterExpression): DbSelect<T>;
    orWhere(filter: DbFilterTerm | DbFilterExpression): DbSelect<T>;
    andWhere(filter: DbFilterTerm | DbFilterExpression): DbSelect<T>;
    orderBy(name: string, descending?: boolean): DbSelect<T>;
    thenOrderBy(name: string, descending?: boolean): DbSelect<T>;
    offset(count: number): DbSelect<T>;
    limit(count: number): DbSelect<T>;
    page(page: number, pageSize: number): DbSelect<T>;
    abstract count(): Promise<number>;
    abstract first(): Promise<T>;
    abstract all(): Promise<T[]>;
    abstract forEach(fn: (param: T) => any): Promise<void>;
}
