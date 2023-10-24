import { AbstractSession, IHandlerParameters } from "@zowe/imperative";
import { IZosFilesResponse } from "@zowe/zos-files-for-zowe-sdk";
import { ZosFilesBaseHandler } from "../../ZosFilesBase.handler";
/**
 * Handler to load a target profile.
 *
 * TODO Consider migrating code for loading target profiles to Imperative
 */
export default class TargetProfileHandler extends ZosFilesBaseHandler {
    /**
     * Build target z/OSMF session from profiles and command arguments.
     */
    process(params: IHandlerParameters): Promise<void>;
    /**
     * Return session config for target profile to pass on to the next handler.
     */
    processWithSession(_params: IHandlerParameters, session: AbstractSession): Promise<IZosFilesResponse>;
}
