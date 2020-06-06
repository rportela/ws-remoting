export interface MethodHandler {
}
export declare class MethodHandlers<T> {
    private methods;
    set(method: string, handler: T): void;
    unset(method: string): void;
}
