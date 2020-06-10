import { Db } from "../common/Db";
import { JsonRpcServer } from "./JsonRpcServer";
export default class RemoteDbServer extends JsonRpcServer {
    private databases;
    constructor(databases: Db[]);
    private onAdd;
    private onPut;
    private onDelete;
    private onSchema;
    private onQuery;
    private onScalar;
    private onSync;
    getDatabase(name: string): Db;
}
