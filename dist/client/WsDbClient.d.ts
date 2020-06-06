import JsonRpcClient from "./JsonRpcClient";
import ObservableDb from "./ObservableDb";
export default class WsDbClient extends JsonRpcClient {
    private schemas;
    private dbs;
    private onRecordAdd;
    private onRecordPut;
    private onRecordDelete;
    private onRemoteRecordAdd;
    private onRemoteRecordPut;
    private onRemoteRecordDelete;
    private createLocalDb;
    private closeLocalDb;
    private loadLocalDbs;
    private callSync;
    private refreshLocalDbs;
    constructor(addess: string, protocols?: string | string[]);
    onDbAvailable: (wsdb: WsDbClient) => any;
    getDb(name: string): ObservableDb;
}
