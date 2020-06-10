import { DbFilter, DbFilterExpression, DbFilterTerm, DbFilterType } from "./DbFilters";
import { DbOrderBy } from "./DbSort";

/**
 * Interfaces a database select with configurable where clause,
 * orderBy clause, offset number and a limit of records.
 * @author Rodrigo Portela
 */
export abstract class DbSelect<T> {
  _from: string;
  _where: DbFilter;
  _orderBy: DbOrderBy;
  _offset: number;
  _limit: number;
  constructor(from: string) {
    this._from = from;
  }
  where(filter: DbFilterTerm | DbFilterExpression): DbSelect<T> {
    this._where = filter;
    return this;
  }
  orWhere(filter: DbFilterTerm | DbFilterExpression): DbSelect<T> {
    if (this._where) {
      if (this._where.filterType() === DbFilterType.EXPRESSION) {
        const exp: any = this._where;
        exp.or(filter);
      } else {
        const exp: DbFilterExpression = new DbFilterExpression(filter);
        this._where = exp.or(filter);
      }
    } else {
      this._where = filter;
    }
    return this;
  }
  andWhere(filter: DbFilterTerm | DbFilterExpression): DbSelect<T> {
    if (this._where) {
      if (this._where.filterType() === DbFilterType.EXPRESSION) {
        const exp: any = this._where;
        exp.and(filter);
      } else {
        const exp: DbFilterExpression = new DbFilterExpression(filter);
        this._where = exp.and(filter);
      }
    } else {
      this._where = filter;
    }
    return this;
  }
  orderBy(name: string, descending?: boolean): DbSelect<T> {
    this._orderBy = new DbOrderBy(name, descending);
    return this;
  }
  thenOrderBy(name: string, descending?: boolean): DbSelect<T> {
    if (this._orderBy) {
      let ob = this._orderBy;
      while (ob.next) ob = ob.next;
      ob.next = new DbOrderBy(name, descending);
    } else {
      this._orderBy = new DbOrderBy(name, descending);
    }
    return this;
  }
  offset(count: number): DbSelect<T> {
    this._offset = count;
    return this;
  }
  limit(count: number): DbSelect<T> {
    this._limit = count;
    return this;
  }
  page(page: number, pageSize: number): DbSelect<T> {
    this._offset = pageSize * page;
    this._limit = pageSize;
    return this;
  }
  abstract count(): Promise<number>;
  abstract first(): Promise<T>;
  abstract all(): Promise<T[]>;
  abstract forEach(fn: (param: T) => any): void;
}
