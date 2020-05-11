export const WsResponseType = {
  SUCCESS: "SUCCESS",
  ERROR: "ERROR",
  BROADCAST: "BROADCAST",
};
export class WsResponse {
  id?: number;
  responseType: string;
  result?: any;
  error?: string;
  action?: string;
}
