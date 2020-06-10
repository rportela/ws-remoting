import Handlers from "./Handlers";
/**
 * A rpc call is represented by sending a Request object to a Server. The Request object has the following members
 */
export interface JsonRpcRequest {
    /**
     * A String specifying the version of the JSON-RPC protocol. MUST be exactly "2.0".
     */
    jsonrpc: string;
    /**
     * A String containing the name of the method to be invoked.
     * Method names that begin with the word rpc followed by a period character (U+002E or ASCII 46)
     * are reserved for rpc-internal methods and extensions and MUST NOT be used for anything else.
     */
    method: string;
    /**
     * A Structured value that holds the parameter values to be used during the invocation of the method. This member MAY be omitted.
     */
    params?: any;
    /**
     * An identifier established by the Client that MUST contain a String, Number, or NULL value if included.
     * If it is not included it is assumed to be a notification. The value SHOULD normally not be Null and Numbers SHOULD NOT contain fractional parts.
     */
    id: string | number | null;
}
/**
 * When a rpc call encounters an error, the Response Object MUST contain the error member with a value that is a Object with the following members:
 */
export interface JsonRpcError {
    /**
     * A Number that indicates the error type that occurred.
     * This MUST be an integer.
     */
    code: number;
    /**
     * A String providing a short description of the error.
     * The message SHOULD be limited to a concise single sentence.
     */
    message: string;
    /**
     * A Primitive or Structured value that contains additional information about the error.
     * This may be omitted.
     * The value of this member is defined by the Server (e.g. detailed error information, nested errors etc.)
     */
    data?: any;
}
/**
 * When a rpc call is made, the Server MUST reply with a Response, except for in the case of Notifications.
 * The Response is expressed as a single JSON Object, with the following members:
 */
export interface JsonRpcResponse {
    /**
     * A String specifying the version of the JSON-RPC protocol. MUST be exactly "2.0".
     */
    jsonrpc: string;
    /**
     * This member is REQUIRED on success.
     * This member MUST NOT exist if there was an error invoking the method.
     * The value of this member is determined by the method invoked on the Server.
     */
    result?: any;
    /**
     * This member is REQUIRED on error.
     * This member MUST NOT exist if there was no error triggered during invocation.
     */
    error?: JsonRpcError;
    /**
     * This member is REQUIRED.
     * It MUST be the same as the value of the id member in the Request Object.
     * If there was an error in detecting the id in the Request object (e.g. Parse error/Invalid Request), it MUST be Null.
     */
    id: string | number | null;
}
/**
 * Tests a message to tell if it's a request or alternatively a response.
 *
 * @param message
 */
export declare function isRpcRequest(message: JsonRpcRequest | JsonRpcResponse): message is JsonRpcRequest;
/**
 * Implements the Json RPC request and the resolve and reject functions
 * that attach this to a promise.
 *
 */
export declare class JsonRpcPendingRequest implements JsonRpcRequest {
    /**
     * Resolves a pending promise.
     */
    resolve: (param?: any) => any;
    /**
     * Rejects a pending promise.
     */
    reject: (err: JsonRpcError) => void;
    /**
     * This is the method that should have a handler attached to.
     */
    method: string;
    /**
     * The id of the request or null if it is a notification.
     */
    id: string | number | null;
    /**
     * The parameters to be passed to the handler of the method.
     */
    params?: any;
    /**
     * The version or the JSON RPC, usually 2.0.
     */
    jsonrpc: string;
    /**
     *  Constructs a new object by assigning all attributes on a single call.
     *
     * @param resolve
     * @param reject
     * @param id
     * @param method
     * @param params
     */
    constructor(resolve: (param?: any) => any, reject: (err: JsonRpcError) => void, id: string | number | null, method: string, params?: any);
}
/**
 * A union of all available data that can be transmitted on a web socket.
 */
export declare type SocketData = string | ArrayBuffer | SharedArrayBuffer | Blob | ArrayBufferView;
/**
 * Creates a new RPC request id;
 */
export declare function createRpcId(): string;
/**
 *
 */
export declare class JsonRpc extends Handlers {
    private pending;
    /**
     * Tries to find a generic handler to errors.
     * If none is found, console.error is used to display an error.
     */
    raiseError: (err: Error) => void;
    call(pipe: (json: string) => void, method: string, params?: any): Promise<any>;
    resolve(response: JsonRpcResponse): void;
    notify(pipe: (json: string) => void, method: string, params?: any): void;
}
