/**
 * This is an event emitter.
 * You can store diferent listeners and emit events on this instance.
 * And can combine this with other emitters to forward events to them;
 *
 * @author Rodrigo Portela
 */
export default class EventEmitter {
  private listeners: any = {};

  /**
   * This method registers a listener for a specific event on this this dispatcher.
   *
   * @param key
   * @param listener
   */
  on(key: string, listener: (params?: any) => void): boolean {
    let listeners: any[] = this.listeners[key];
    if (!listeners) {
      listeners = [listener];
      this.listeners[key] = listeners;
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
   * This method removes a listener from our listener bag.
   *
   * @param key
   * @param dispacher
   */
  off(key: string, listener: (params?: any) => void): boolean {
    let listeners: any[] = this.listeners[key];
    if (!listeners) return false;
    let index = listeners.indexOf(listener);
    if (index < 0) return false;
    listeners.splice(index, 1);
    return true;
  }

  /**
   * This method dispatches an event to all listeners of that specific key;
   * And returns the numer of listeners that were connected to it.
   * @param key
   * @param params
   */
  emit(key: string, params?: any): number {
    let dispachers: any[] = this.listeners[key];
    if (!dispachers) return 0;
    let counter = 0;
    dispachers.forEach((d) => {
      try {
        d(params);
        counter++;
      } catch (e) {
        console.error(e);
        console.trace(e);
      }
    });
    return counter;
  }
}
