export default class Handlers {
    private handlers;
    setHandler(method: string, handler: (...any: any[]) => any): void;
    removeHandler(method: string): void;
    getHandler(method: string): any;
    run(method: string, ...params: any): Promise<any>;
}
