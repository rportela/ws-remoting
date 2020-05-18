export interface WsMessage {
    id: number;
    action: string;
    params: any;
    sent_at?: Date;
}
export declare class WsRequest implements WsMessage {
    id: number;
    action: string;
    params: any;
    sent_at?: Date;
    resolve: (params: any) => any;
    reject: (err: Error) => void;
    constructor(action: string, params: any, resolve: (params: any) => any, reject: (err: Error) => void);
}
export declare enum WsResponseType {
    SUCCESS = "SUCCESS",
    ERROR = "ERROR",
    BROADCAST = "BROADCAST"
}
export declare class WsResponse {
    id?: number;
    responseType: WsResponseType;
    result?: any;
    error?: string;
    action?: string;
}
