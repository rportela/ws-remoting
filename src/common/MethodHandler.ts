export interface MethodHandler {}

export class MethodHandlers<T> {
  private methods: any = {};

  set(method: string, handler: T) {
    this.methods[method] = handler;
  }
  unset(method: string) {
    delete this.methods[method];
  }
}
