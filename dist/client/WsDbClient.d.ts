import { ObservableDb } from "./ObservableDb";
export default class WsDbClient {
    private socket;
    private messagedb;
    private opening;
    constructor(url: string);
    private notifyServer;
    private onConnect;
    private fetchDbRecords;
    private fetchCollectionRecords;
    private onError;
    private onServerDelete;
    private onServerInsert;
    private onServerUpdate;
    private onClientDelete;
    private onClientInsert;
    private onClientUpdate;
    private onSchema;
    getDb(name: string): Promise<ObservableDb>;
}
