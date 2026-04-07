import { program } from "commander";
import { registerDbStatus } from "./commands/db-status";
import { registerDbInfo } from "./commands/db-info";
import { registerDbSetup } from "./commands/db-setup";
import { registerDbSeed } from "./commands/db-seed";
import { registerCheckEnv } from "./commands/check-env";
import { registerUserList } from "./commands/user-list";
import { registerUserCreate } from "./commands/user-create";
import { registerUserUpdate } from "./commands/user-update";
import { registerUserDelete } from "./commands/user-delete";
import { registerSessionList } from "./commands/session-list";
import { registerSessionRevoke } from "./commands/session-revoke";
import { registerAddRoute } from "./commands/add-route";
import { registerClean } from "./commands/clean";
import { registerTypecheck } from "./commands/typecheck";
import { registerDeploy } from "./commands/deploy";
import { registerLogs } from "./commands/logs";
import { registerRailwayStatus } from "./commands/railway-status";
import { registerRailwaySetup } from "./commands/railway-setup";

program
  .name("cli")
  .description("Agency Starter Kit CLI")
  .version("0.0.1");

// Database
registerDbStatus(program);
registerDbInfo(program);
registerDbSetup(program);
registerDbSeed(program);
registerCheckEnv(program);

// Users & sessions
registerUserList(program);
registerUserCreate(program);
registerUserUpdate(program);
registerUserDelete(program);
registerSessionList(program);
registerSessionRevoke(program);

// Dev workflow
registerAddRoute(program);
registerClean(program);
registerTypecheck(program);

// Railway
registerDeploy(program);
registerLogs(program);
registerRailwayStatus(program);
registerRailwaySetup(program);

program.parse();
