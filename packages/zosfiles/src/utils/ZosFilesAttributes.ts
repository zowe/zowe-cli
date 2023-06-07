/*
* This program and the accompanying materials are made available under the terms of the
* Eclipse Public License v2.0 which accompanies this distribution, and is available at
* https://www.eclipse.org/legal/epl-v20.html
*
* SPDX-License-Identifier: EPL-2.0
*
* Copyright Contributors to the Zowe Project.
*
*/

import * as fs from "fs";
import * as minimatch from "minimatch";
import { ImperativeError, Logger, TextUtils } from "@zowe/imperative";
import { ZosFilesMessages } from "../constants/ZosFiles.messages";
import * as pathUtils from "path";
import { Tag } from "../methods/utilities";

export enum TransferMode {BINARY, TEXT}

interface IUploadAttributes {
    ignore: boolean;
    localEncoding?: string;
    remoteEncoding?: string;
}

/**
 * Attributes for a set of files relating to how they will be uploaded to USS
 */
export class ZosFilesAttributes {

    private static MAX_EXPECTED_FIELDS = 3;  // eslint-disable-line @typescript-eslint/no-magic-numbers
    private static MIN_EXPECTED_FIELDS = 2;

    private attributes = new Map<string,IUploadAttributes>();
    private basePath: string;

    constructor(attributesFileContents: string, basePath?: string) {
        this.parse(attributesFileContents);
        this.basePath = basePath;
    }

    public static loadFromFile(filePath?: string, defaultDir?: string): ZosFilesAttributes | undefined {
        let attributesFile;
        if (filePath != null) {
            if (!fs.existsSync(filePath)) {
                throw new ImperativeError({ msg: TextUtils.formatMessage(ZosFilesMessages.attributesFileNotFound.message,
                    { file: filePath })});
            }
            attributesFile = filePath;
        }
        else {
            const localAttributesFile = pathUtils.join(defaultDir ?? process.cwd(), ".zosattributes");
            if (fs.existsSync(localAttributesFile)) {
                attributesFile = localAttributesFile;
            } else {
                return;
            }
        }

        let attributesFileContents;
        try {
            attributesFileContents = fs.readFileSync(attributesFile).toString();
        }
        catch (err) {
            throw new ImperativeError({ msg: TextUtils.formatMessage(
                ZosFilesMessages.errorReadingAttributesFile.message,
                { file: attributesFile, message: err.message })});
        }

        let attributes;
        try {
            attributes = new ZosFilesAttributes(attributesFileContents, defaultDir);
        }
        catch (err) {
            throw new ImperativeError({ msg: TextUtils.formatMessage(
                ZosFilesMessages.errorParsingAttributesFile.message,
                { file: attributesFile, message: err.message })});
        }
        return attributes;
    }

    public fileShouldBeUploaded(path: string): boolean {
        let result = false;
        const attributes = this.findLastMatchingAttributes(path);

        if (attributes === null) {
            result = true;
        } else {
            result = !attributes.ignore;
        }

        Logger.getAppLogger().debug("path: " + path + " : " + attributes + " result = " + result);
        return result;
    }

    public fileShouldBeIgnored(path: string): boolean {
        return !this.fileShouldBeUploaded(path);
    }

    public getFileTransferMode(path: string, preferBinary?: boolean): TransferMode {
        const attributes = this.findLastMatchingAttributes(path);
        if (attributes === null) {
            return preferBinary ? TransferMode.BINARY : TransferMode.TEXT;
        }

        if (attributes.localEncoding === Tag.BINARY || attributes.localEncoding === attributes.remoteEncoding) {
            return TransferMode.BINARY;
        } else {
            return TransferMode.TEXT;
        }
    }

    public getRemoteEncoding(path: string): string {
        const attributes = this.findLastMatchingAttributes(path);
        if (attributes === null || attributes.remoteEncoding?.toUpperCase() === "EBCDIC") {
            return;  // Fall back to default system code page
        }

        return attributes.remoteEncoding;
    }

    public getLocalEncoding(path: string): string {
        const attributes = this.findLastMatchingAttributes(path);
        if (attributes === null) {
            return "ISO8859-1";
        }

        return attributes.localEncoding;
    }

    private parse(attributesFileContents: string) {
        const lines = attributesFileContents.split("\n");
        let lineNumber = 0;
        lines.forEach((line) => {
            lineNumber++;
            line = line.trim();
            if (line === "" || line.startsWith("#")) {
                return;
            }
            const parts = line.trim().split(/\s+/);
            const pattern = parts[0];
            const localEncoding = parts[1];
            const remoteEncoding = parts[2];

            if (parts.length > ZosFilesAttributes.MAX_EXPECTED_FIELDS || parts.length < ZosFilesAttributes.MIN_EXPECTED_FIELDS) {
                throw new Error(TextUtils.formatMessage(ZosFilesMessages.invalidAttributesSyntax.message, {lineNumber}));
            }

            if (localEncoding === "-") {
                this.attributes.set(pattern, {ignore: true});
            } else {
                this.attributes.set(pattern, {ignore: false, localEncoding, remoteEncoding});
            }
        });
    }

    private findLastMatchingAttributes(path: string): IUploadAttributes {
        let relativePath = path;
        if (this.basePath) {
            relativePath = pathUtils.relative(this.basePath,path);
        }

        let result: IUploadAttributes = null;
        this.attributes.forEach((attributes, pattern) => {
            if (minimatch(relativePath,pattern,{matchBase: true, dot: true })) {
                result = attributes;
            }
        });
        return result;
    }
}
