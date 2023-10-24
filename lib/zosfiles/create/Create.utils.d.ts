import { Arguments } from "yargs";
import { ICreateDataSetOptions } from "@zowe/zos-files-for-zowe-sdk";
/**
 * Generate the appropriate options object to create a dataset before sending it to the z/OS MF APIs
 * @param {yargs.Arguments} commandArguments - The provided command arguments
 * @return {ICreateDataSetOptions} Object to be sent
 */
export declare function generateZosmfOptions(commandArguments: Arguments): ICreateDataSetOptions;
