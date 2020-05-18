/**
 * This class contains a dictionary of event dispatchers.
 * You can store diferent events and their dispatchers on this instance.
 * And can combine this with other dispatchers to forward events to them;
 *
 * @author Rodrigo Portela
 */
export default class Dispatcher {
    private dispatchers;
    /**
     * This method registers a listener for a specific event on this this dispatcher.
     *
     * @param key
     * @param listener
     */
    register(key: string, listener: (params: any) => void): boolean;
    /**
     * This method removes a listener from our listener bag of arrays.
     *
     * @param key
     * @param dispacher
     */
    unregister(key: string, listener: (params: any) => void): boolean;
    /**
     * This method dispatches an event to all listeners of that specific key;
     * @param key
     * @param params
     */
    dispatch(key: string, params: any): boolean;
}
