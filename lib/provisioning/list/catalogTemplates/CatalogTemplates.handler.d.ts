import { IHandlerParameters } from "@zowe/imperative";
import { ZosmfBaseHandler } from "@zowe/zosmf-for-zowe-sdk";
/**
 * Handler to list template catalog
 * @export
 * @class Handler
 * @implements {ICommandHandler}
 */
export default class CatalogTemplatesHandler extends ZosmfBaseHandler {
    processCmd(commandParameters: IHandlerParameters): Promise<void>;
}
