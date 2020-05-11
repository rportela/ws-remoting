/**
 * This class contains a dictionary of event dispatchers.
 * You can store diferent events and their dispatchers on this instance.
 * And can combine this with other dispatchers to forward events to them;
 *
 * @author Rodrigo Portela
 */
export default class Dispatcher {
  private dispatchers: any = {};

  /**
   * This method registers a listener for a specific event on this this dispatcher.
   *
   * @param key
   * @param listener
   */
  register(key: string, listener: any): boolean {
    let listeners: any[] = this.dispatchers[key];
    if (!listeners) {
      listeners = [listener];
      this.dispatchers[key] = listeners;
      return true;
    } else {
      let index = listeners.indexOf(listener);
      if (index < 0) {
        listeners.push(listener);
        return true;
      } else {
        return false;
      }
    }
  }

  /**
   * This method removes a listener from our listener bag of arrays.
   *
   * @param key
   * @param dispacher
   */
  unregister(key: string, listener: any): boolean {
    let listeners: any[] = this.dispatchers[key];
    if (!listeners) return false;
    let index = listeners.indexOf(listener);
    if (index < 0) return false;
    listeners.splice(index, 1);
    return true;
  }

  /**
   * This method dispatches an event to all listeners of that specific key;
   * @param key
   * @param params
   */
  dispatch(key: string, params: any): boolean {
    let dispachers: any[] = this.dispatchers[key];
    if (!dispachers) return false;
    for (const d of dispachers) {
      try {
        d(params);
      } catch (e) {
        console.error(e);
        console.trace(e);
      }
    }
    return true;
  }
}
