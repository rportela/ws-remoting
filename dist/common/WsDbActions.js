"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Db_1 = require("./Db");
exports.default = {
    INSERTED: Db_1.DbActions.INSERTED,
    UPDATED: Db_1.DbActions.UPDATED,
    DELETED: Db_1.DbActions.DELETED,
    SCHEMA: "SCHEMA",
    QUERY: "QUERY",
    GET: "GET",
};
