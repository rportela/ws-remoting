export declare const WsResponseType: {
    SUCCESS: string;
    ERROR: string;
    BROADCAST: string;
};
export declare class WsResponse {
    id?: number;
    responseType: string;
    result?: any;
    error?: string;
    action?: string;
}
