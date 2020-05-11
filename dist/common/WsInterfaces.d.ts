export declare const WsClientActions: {
    CONNECT: string;
    DISCONNECT: string;
    ERROR: string;
};
export declare const WsResponseType: {
    SUCCESS: string;
    BROADCAST: string;
    ERROR: string;
};
export interface WsServerAction {
    (sender: string, params: any): any;
}
/**
 * This class represents a request. A message waiting to be answered from a remote server.
 *
 * @author Rodrigo Portela
 */
export declare class WsRequest {
    id: number;
    action: string;
    params: any;
    sent_at: Date | null;
    resolve: (p: any) => void;
    reject: (p: Error) => void;
    /**
     * Initializes this class with constructor parameters.
     * @param action
     * @param params
     * @param resolve
     * @param reject
     */
    constructor(action: string, params: any, resolve: (p: any) => void, reject: (p: Error) => void);
}
export default class WsResponse {
    id?: number;
    responseType: string;
    result?: any;
    error?: string;
}
