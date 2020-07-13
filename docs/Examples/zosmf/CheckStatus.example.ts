import { CheckStatus, IZosmfInfoResponse } from "../../../packages/zosmf";
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
        // tslint:disable-next-line: no-console
        console.log(response);
        exit(0);
    } catch (err) {
        // tslint:disable-next-line: no-console
        console.error(err);
        exit(1);
    }
}

main();
