export default class Handlers {
  private handlers: any = {};

  setHandler(method: string, handler: (...any) => any) {
    this.handlers[method] = handler;
  }

  removeHandler(method: string) {
    delete this.handlers[method];
  }

  getHandler(method: string): any {
    return this.handlers[method];
  }

  run(method: string, ...params: any): Promise<any> {
    return new Promise((resolve, reject) => {
      const handler: (...any) => any = this.handlers[method];
      if (!handler) reject(new Error("No such method " + method));
      else {
        try {
          const result = handler(params);
          if (result && result.then) result.then((r) => resolve(r));
          else resolve(result);
        } catch (e) {
          reject(e);
        }
      }
    });
  }
}
