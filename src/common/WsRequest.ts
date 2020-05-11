/**
 * This class represents a request. A message waiting to be answered from a remote server.
 *
 * @author Rodrigo Portela
 */
export default class WsRequest {
  id: number;
  action: string;
  params: any;
  sent_at: Date | null = null;
  resolve: (p: any) => void;
  reject: (p: Error) => void;

  /**
   * Initializes this class with constructor parameters.
   * @param action
   * @param params
   * @param resolve
   * @param reject
   */
  constructor(
    action: string,
    params: any,
    resolve: (p: any) => void,
    reject: (p: Error) => void
  ) {
    this.id = new Date().getTime();
    this.action = action;
    this.params = params;
    this.resolve = resolve;
    this.reject = reject;
  }
}
