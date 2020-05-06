/**
 * This class represents a promise. A message waiting to be answered from a remote server.
 *
 * @author Rodrigo Portela
 */
export default class WsRemotingMessage {
  /**
   * A unique id for the message so it can be identified when a response comes back from the socket.
   */
  id: number;
  /**
   * The name of the remote action to invoke on the server.
   */
  action: string;
  /**
   * Any parameters necessary for the invokation.
   */
  params: any;
  /**
   * The control date where the request has been sent to the server. Messages will be buffered on disconnection.
   */
  sent_at: Date | null = null;
  /**
   * The resolve method of a given promise.
   */
  resolve: (p: any) => void;
  /**
   * The reject method of a given promise.
   */
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
