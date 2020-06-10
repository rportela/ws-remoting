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
      ? (a: any, b: any) => a[this.name] - b[this.name]
      : (a: any, b: any) => b[this.name] - a[this.name];
  }
  sort(arr: any[]) {
    arr.sort(this.createComparer());
    if (this.next) {
      this.next.sort(arr);
    }
  }
}
