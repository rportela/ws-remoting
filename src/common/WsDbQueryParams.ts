import { DbQuery } from "./Db";

export default interface WsDbQueryParams {
  db: string;
  name: string;
  query?: DbQuery;
}
