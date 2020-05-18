import * as WebSocket from "ws";
import { Db } from "../common/Db";
import { WsServer } from "./WsServer";
export default class WsDbServer extends WsServer {
    private databases;
    constructor(databases: Db[], options: WebSocket.ServerOptions);
    private onInsert;
    private onUpdate;
    private onDelete;
    private onSchema;
    private onQuery;
    private onScalar;
    getDatabase(name: string): Db;
}
