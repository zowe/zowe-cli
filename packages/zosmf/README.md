# z/OS Management Facility Package

Contains APIs and commands to interact with the z/OS Management Facility (using z/OSMF REST endpoints).

# API Examples

**Check z/OSMF status**

```typescript
import { CheckStatus, IZosmfInfoResponse } from "@zowe/cli";
import { Session, ISession, SessConstants } from "@zowe/imperative";

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

// Session Options
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
    let response: IZosmfInfoResponse;
    try {
        response = await CheckStatus.getZosmfInfo(session);
        console.log(response);
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

main();
```

#
**List systems defined to z/OSMF**

```typescript
import { ListDefinedSystems, IZosmfListDefinedSystemsResponse } from "@zowe/cli";
import { Session, ISession, SessConstants } from "@zowe/imperative";

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

// Session Options
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
    let response: IZosmfListDefinedSystemsResponse;
    try {
        response = await ListDefinedSystems.listDefinedSystems(session);
        console.log(response);
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

main();
```