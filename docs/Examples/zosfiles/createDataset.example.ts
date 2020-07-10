import { Create, ICreateDataSetOptions, IZosFilesResponse, CreateDataSetTypeEnum } from "../../../packages/zosfiles";
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

// Download Options
const dataset: string = "ZOWEUSER.PUBLIC.NEW.DATASET";
const options: ICreateDataSetOptions = {
    primary: 10,
    secondary: 1,
    alcunit: "TRK",
    lrecl: 80
};
const dataSetType = CreateDataSetTypeEnum.DATA_SET_CLASSIC
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
    let response: IZosFilesResponse;
    try {
        response = await Create.dataSet(session, dataSetType, dataset, options);
        // tslint:disable-next-line: no-console
        console.log(response);
        exit(0);
    } catch (err) {
        // tslint:disable-next-line: no-console
        console.log(err.message);
        exit(1);
    }
}

main();
