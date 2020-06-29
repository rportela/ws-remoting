/**
 * Wraps a sequence of order by expressions where you can define
 * a column name and a direction for the sort.
 * @author Rodrigo Portela
 */

export interface DbOrderByGetter {
  (record: any): any;
}
export class DbOrderBy {
  getter: DbOrderByGetter;
  descending: boolean;
  next?: DbOrderBy;

  constructor(getter: string | DbOrderByGetter, descending: boolean = false) {
    this.getter =
      typeof getter === "string" ? (record: any) => record[getter] : getter;
    this.descending = descending;
  }

  createComparer() {
    return this.descending
      ? (a: any, b: any) => {
          const x = this.getter(b);
          const y = this.getter(a);
          return x === y ? 0 : x > y ? 1 : -1;
        }
      : (a: any, b: any) => {
          const x = this.getter(a);
          const y = this.getter(b);
          return x === y ? 0 : x > y ? 1 : -1;
        };
  }
  sort(arr: any[]) {
    arr.sort(this.createComparer());
    if (this.next) {
      this.next.sort(arr);
    }
  }
}
