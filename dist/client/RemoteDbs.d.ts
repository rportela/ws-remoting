import ObservableDb from "./ObservableDb";
import WebSocketRpc from "./WebSocketRpc";
export default class WsDbClient extends WebSocketRpc {
    private schemas;
    private dbs;
    private onRecordAdd;
    private onRecordPut;
    private onRecordDelete;
    private onRemoteRecordAdd;
    private onRemoteRecordPut;
    private onRemoteRecordDelete;
    private onRemoteConnect;
    private onRemoteSchema;
    private createLocalDb;
    private callSync;
    constructor(addess: string, protocols?: string | string[]);
    getDb(name: string): Promise<ObservableDb>;
}
