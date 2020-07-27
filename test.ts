import { Create } from "./packages/zosfiles/src/api/methods/create/Create";
import { Session, ISession, SessConstants } from "@zowe/imperative";
import { ICreateDataSetOptions } from "./packages/zosfiles/src/api/methods/create/doc/ICreateDataSetOptions";
import { CreateDataSetTypeEnum } from "./packages/zosfiles/src/api/methods/create/CreateDataSetType.enum";
import { IZosFilesResponse } from "./packages/zosfiles/src/api/doc/IZosFilesResponse";

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

// Create Options
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
        response = await Create.dataSetLike(session, dataset + "2", {like: dataset, showAttributes: true});
        console.log(response);
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

main();