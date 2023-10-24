/// <reference types="node" />
import { AbstractSession, ICommandArguments } from "@zowe/imperative";
import { CompareBaseHelper } from '../CompareBaseHelper';
import { CompareBaseHandler } from '../CompareBase.handler';
/**
 * Handler to compare a localfile and a dataset content
 * @export
 */
export default class LocalfileDatasetHandler extends CompareBaseHandler {
    getFile1(session: AbstractSession, args: ICommandArguments, helper: CompareBaseHelper): Promise<Buffer>;
    getFile2(session: AbstractSession, args: ICommandArguments, helper: CompareBaseHelper): Promise<Buffer>;
}
