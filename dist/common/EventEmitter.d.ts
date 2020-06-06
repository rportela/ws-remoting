/**
 * This is an event emitter.
 * You can store diferent listeners and emit events on this instance.
 * And can combine this with other emitters to forward events to them;
 *
 * @author Rodrigo Portela
 */
export default class EventEmitter {
    private listeners;
    /**
     * This method registers a listener for a specific event on this this dispatcher.
     *
     * @param key
     * @param listener
     */
    on(key: string, listener: (params?: any) => void): boolean;
    /**
     * This method removes a listener from our listener bag.
     *
     * @param key
     * @param dispacher
     */
    off(key: string, listener: (params?: any) => void): boolean;
    /**
     * This method dispatches an event to all listeners of that specific key;
     * And returns the numer of listeners that were connected to it.
     * @param key
     * @param params
     */
    emit(key: string, params?: any): number;
}
