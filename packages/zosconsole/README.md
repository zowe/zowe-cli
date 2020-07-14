# z/OS Console Package

Contains APIs and commands to work with the z/OS console (using z/OSMF console REST endpoints).

# API Examples

**Submit a command to the z/OS console**

```typescript
import { IssueCommand, IIssueParms, IConsoleResponse } from "../../../packages/zosconsole";
import { Session, ISession, SessConstants } from "@zowe/imperative";
import { exit } from "process";

// Connection Options
const hostname: string = "yourhost.yourdomain.net";
const port: number = 443;
const user: string = "ZOWEUSER";
const password: string = "ZOWEPASS";
const protocol: SessConstants.HTTP_PROTOCOL_CHOICES = "https";
const basePath: string = undefined;
const type: SessConstants.AUTH_TYPE_CHOICES = "basic";
const tokenType: string = undefined;
const tokenValue: string = undefined;
const rejectUnauthorized: boolean = false;

// Console Options
const parms: IIssueParms = {
    command: "D IPLINFO",
    sysplexSystem: undefined,
    solicitedKeyword: undefined,
    async: "N"
}
const sessionConfig: ISession = {
    hostname,
    port,
    user,
    password,
    protocol,
    basePath,
    type,
    tokenType,
    tokenValue,
    rejectUnauthorized
}

const session = new Session(sessionConfig);

async function main() {
    let response: IConsoleResponse;
    try {
        response = await IssueCommand.issue(session, parms);
        console.log(response);
        exit(0);
    } catch (err) {
        console.error(err);
        exit(1);
    }
}

main();
```

#
**Get the response from a command sent to the z/OS console**

```typescript
import { CollectCommand, ICollectParms, IConsoleResponse } from "../../../packages/zosconsole";
import { Session, ISession, SessConstants } from "@zowe/imperative";
import { exit } from "process";

// Connection Options
const hostname: string = "yourhost.yourdomain.net";
const port: number = 443;
const user: string = "ZOWEUSER";
const password: string = "ZOWEPASS";
const protocol: SessConstants.HTTP_PROTOCOL_CHOICES = "https";
const basePath: string = undefined;
const type: SessConstants.AUTH_TYPE_CHOICES = "basic";
const tokenType: string = undefined;
const tokenValue: string = undefined;
const rejectUnauthorized: boolean = false;

// Console Options
const parms: ICollectParms = {
    commandResponseKey: "KEY",
    waitToCollect: undefined,
    followUpAttempts: undefined
}
const sessionConfig: ISession = {
    hostname,
    port,
    user,
    password,
    protocol,
    basePath,
    type,
    tokenType,
    tokenValue,
    rejectUnauthorized
}

const session = new Session(sessionConfig);

async function main() {
    let response: IConsoleResponse;
    try {
        response = await CollectCommand.collect(session, parms);
        console.log(response);
        exit(0);
    } catch (err) {
        console.error(err);
        exit(1);
    }
}

main();
```