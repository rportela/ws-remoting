/**
 * Wraps a sequence of order by expressions where you can define
 * a column name and a direction for the sort.
 * @author Rodrigo Portela
 */
export class DbOrderBy {
  name: string;
  descending: boolean;
  next?: DbOrderBy;

  constructor(name: string, descending: boolean = false) {
    this.name = name;
    this.descending = descending;
  }

  createComparer() {
    return this.descending
      ? (a: any, b: any) => {
          const x = b[this.name];
          const y = a[this.name];
          return x === y ? 0 : x > y ? 1 : -1;
        }
      : (a: any, b: any) => {
          const x = a[this.name];
          const y = b[this.name];
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
