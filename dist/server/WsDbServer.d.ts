import * as WebSocket from "ws";
import { WsServer } from "./WsServer";
import { Db } from "../common/Db";
export default class WsDbServer extends WsServer {
    private databases;
    constructor(databases: Db[], options: WebSocket.ServerOptions);
    getDatabase(name: string): Db;
    private on_inserted;
    private on_updated;
    private on_deleted;
    private on_get_schema;
    private on_get;
    private on_query;
}
