/// <reference types="node" />
import { AbstractSession, ICommandArguments } from "@zowe/imperative";
import { CompareBaseHandler } from "../CompareBase.handler";
import { CompareBaseHelper } from "../CompareBaseHelper";
/**
 * Handler to view a data set's content
 * @export
 */
export default class UssFileHandler extends CompareBaseHandler {
    getFile1(session: AbstractSession, args: ICommandArguments, helper: CompareBaseHelper): Promise<string | Buffer>;
    getFile2(session: AbstractSession, args: ICommandArguments, helper: CompareBaseHelper): Promise<string | Buffer>;
}
