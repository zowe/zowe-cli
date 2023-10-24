import { IZosFilesOptions } from "@zowe/zos-files-for-zowe-sdk";
/**
 * These are the options to be used in file comaparison to handle the
 *  binary, encoding, record and volumeSerial operations in the comparison process
 *
 * @exports
 * @interface ICompareFileOptions
 */
export interface ICompareFileOptions extends IZosFilesOptions {
    binary?: boolean;
    encoding?: string;
    record?: boolean;
    volumeSerial?: string;
}
