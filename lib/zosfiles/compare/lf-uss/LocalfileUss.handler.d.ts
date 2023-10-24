/// <reference types="node" />
import { AbstractSession, ICommandArguments } from "@zowe/imperative";
import { CompareBaseHelper } from '../CompareBaseHelper';
import { CompareBaseHandler } from '../CompareBase.handler';
/**
 * Handler to compare the local file and uss file's content
 * @export
 */
export default class LocalfileUssHandler extends CompareBaseHandler {
    getFile1(session: AbstractSession, args: ICommandArguments, helper: CompareBaseHelper): Promise<string | Buffer>;
    getFile2(session: AbstractSession, args: ICommandArguments, helper: CompareBaseHelper): Promise<string | Buffer>;
}
