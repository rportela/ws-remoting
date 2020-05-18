export interface WsMessage {
  id: number;
  action: string;
  params: any;
  sent_at?: Date;
}

export class WsRequest implements WsMessage {
  id: number;
  action: string;
  params: any;
  sent_at?: Date;
  resolve: (params: any) => any;
  reject: (err: Error) => void;

  constructor(
    action: string,
    params: any,
    resolve: (params: any) => any,
    reject: (err: Error) => void
  ) {
    this.id = new Date().getTime();
    this.action = action;
    this.params = params;

    this.resolve = resolve;
    this.reject = reject;
  }
}

export enum WsResponseType {
  SUCCESS = "SUCCESS",
  ERROR = "ERROR",
  BROADCAST = "BROADCAST",
}

export class WsResponse {
  id?: number;
  responseType: WsResponseType;
  result?: any;
  error?: string;
  action?: string;
}
