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
import * as path from "path";
import * as os from "os";
import { ImperativeReject } from "../../interfaces";
import { ImperativeError } from "../../error";
import { ImperativeExpect } from "../../expect";
// use complete path to ExecUtils to avoid circular dependency that results from utilities/index
import { ExecUtils } from "../../utilities/src/ExecUtils";
import { Readable, Writable } from "stream";
import { mkdirpSync } from "fs-extra";

/**
 * This class will handle common sequences of node I/O and issue messages /
 * throw errors as neccessary.
 * @export
 * @class IO
 */
export class IO {

    /**
     * File delimiter
     * @static
     * @type {string}
     * @memberof IO
     */
    public static readonly FILE_DELIM: string = "/";

    /**
     * UTF8 identifier
     * @static
     * @memberof IO
     */
    public static readonly UTF8 = "utf8";

    /**
     * Windows OS identifier
     * @static
     * @memberof IO
     */
    public static readonly OS_WIN32 = "win32";

    /**
     * Mac OS identifier
     * @static
     * @memberof IO
     */
    public static readonly OS_MAC = "darwin";

    /**
     * Linux OS identifier
     * @static
     * @memberof IO
     */
    public static readonly OS_LINUX = "linux";

    /**
     * Return whether input file is a directory or file
     * @static
     * @param {string} dirOrFile - file path
     * @returns {boolean} - true if file path is a directory, false otherwise
     * @memberof IO
     */
    public static isDir(dirOrFile: string): boolean {
        ImperativeExpect.toBeDefinedAndNonBlank(dirOrFile, "dirOrFile");
        const stat = fs.statSync(dirOrFile);
        return stat.isDirectory();
    }

    /**
     * Take an extension and prefix with a '.' identifier
     * @static
     * @param {string} extension - extension to normalize
     * @returns {string} - '.bin' for input 'bin' for example
     * @memberof IO
     */
    public static normalizeExtension(extension: string): string {
        ImperativeExpect.toNotBeNullOrUndefined(extension, "extension");
        extension = extension.trim();
        if (extension != null && extension.length > 0 && extension[0] !== ".") {
            // add a '.' character to the extension if omitted
            // (if someone specifies just "bin", make the extension ".bin" )
            extension = "." + extension;
        }
        return extension;
    }

    /**
     * Wraps fs.existsSync so that we dont have to import fs unnecessarily
     * @static
     * @param  {string} file - file to validate existence against
     * @returns true if file exists
     * @memberof IO
     */
    public static existsSync(file: string): boolean {
        ImperativeExpect.toBeDefinedAndNonBlank(file, "file");
        return fs.existsSync(file);
    }

    /**
     * Create a directory if it does not yet exist synchronously.
     * @static
     * @param  {string} dir - directory to create
     * @return {undefined}
     * @memberof IO
     */
    public static createDirSync(dir: string) {
        ImperativeExpect.toBeDefinedAndNonBlank(dir, "dir");
        if (!IO.existsSync(dir)) {
            fs.mkdirSync(dir);
        }
    }

    /**
     * Create all needed directories for an input directory in the form of:
     * first/second/third where first will contain director second and second
     * will contain directory third
     * @static
     * @param {string} dir - directory to create all sub directories for
     * @memberof IO
     */
    public static createDirsSync(dir: string) {
        ImperativeExpect.toBeDefinedAndNonBlank(dir, "dir");
        // we're splitting on a specific separator character, so replace \ with /
        // before splitting
        const dirs = path.resolve(dir).replace(/\\/g, IO.FILE_DELIM).split(IO.FILE_DELIM);

        let createDir: string = "";
        for (const crDir of dirs) {

            createDir += (crDir + IO.FILE_DELIM);
            IO.createDirSync(createDir);
        }
    }

    /**
     * Create all necessary directories for a fully qualified file and its path,
     * for example, if filePath = oneDir/twoDir/threeDir/file.txt,
     * oneDir, twoDir, and threeDir will be created.
     * @static
     * @param  {string} filePath [description]
     * @return {[type]}          [description]
     * @memberof IO
     */
    public static createDirsSyncFromFilePath(filePath: string) {
        ImperativeExpect.toBeDefinedAndNonBlank(filePath, "filePath");
        IO.createDirsSync(path.dirname(filePath));
    }

    /**
     * Create a symbolic link to a directory. If the symbolic link already exists,
     * re-create it with the specified target directory.
     *
     * @param {string} newSymLinkPath - the path new symbolic link to be created
     * @param {string} existingDirPath - the path the existing directory that we will link to
     */
    public static createSymlinkToDir(newSymLinkPath: string, existingDirPath: string) {
        try {
            if (!fs.existsSync(newSymLinkPath)) {
                fs.symlinkSync(existingDirPath, newSymLinkPath, "junction");
                return;
            }

            // Get the file status of the existing intended symlink to ensure it is a symlink.
            const fileStats = fs.lstatSync(newSymLinkPath);
            if (fileStats.isSymbolicLink()) {
                fs.unlinkSync(newSymLinkPath);
                fs.symlinkSync(existingDirPath, newSymLinkPath, "junction");
                return;
            }
        } catch (exception) {
            throw new ImperativeError({
                msg: "Failed to create symbolic link from '" + newSymLinkPath +
                        "' to '" + existingDirPath + "'\n" +
                        "Reason: " + exception.message + "\n" +
                        "Full exception: " + exception
            }
            );
        }

        throw new ImperativeError({
            msg: "The intended symlink '" + newSymLinkPath +
                    "' already exists and is not a symbolic link. So, we did not create a symlink from there to '" +
                    existingDirPath + "'."
        }
        );
    }

    /**
     * Uses the fs-extra package to create a directory (and all subdirectories)
     * @static
     * @param {string} dir - the directory (do not include a file name)
     * @memberof IO
     */
    public static mkdirp(dir: string) {
        ImperativeExpect.toBeDefinedAndNonBlank(dir, "dir");
        mkdirpSync(dir);
    }

    /**
     * Wraps fs.readFileSync so that we dont have to import fs unnecessarily
     * or specify encoding.
     * @static
     * @param  {string} file - file to read
     * @param normalizeNewLines - remove Windows line endings (\r\n)  in favor of \n
     * @param binary - should the file be read in binary mode? If so, normalizeNewLines is ignored. If false,
     *                 the file will be read in UTF-8 encoding
     * @return Buffer - the content of the file
     * @memberof IO
     */
    public static readFileSync(file: string, normalizeNewLines: boolean = false, binary: boolean = false): Buffer {
        ImperativeExpect.toBeDefinedAndNonBlank(file, "file");

        if (binary) {
            return fs.readFileSync(file);
        } else {
            let content = fs.readFileSync(file, IO.UTF8).toString();
            if (normalizeNewLines) {
                content = content.replace(/\r\n/g, "\n");
            }
            return Buffer.from(content, IO.UTF8);
        }
    }

    /**
     * Create a Node.js Readable stream from a file
     * @param file - the file from which to create a read stream
     * @return Buffer - the content of the file
     * @memberof IO
     */
    public static createReadStream(file: string): Readable {
        ImperativeExpect.toBeDefinedAndNonBlank(file, "file");
        return fs.createReadStream(file, {autoClose: true});
    }

    /**
     * Create a Node.js Readable stream from a file
     * @param file - the file from which to create a read stream
     * @return Buffer - the content of the file
     * @memberof IO
     */
    public static createWriteStream(file: string): Writable {
        ImperativeExpect.toBeDefinedAndNonBlank(file, "file");
        return fs.createWriteStream(file, {autoClose: true});
    }

    /**
     * Process a string so that its line endings are operating system
     * appropriate before you save it to disk
     * (basically, if the user is on Windows, change  \n to \r\n)
     * @static
     * @param {string} original - original input
     * @param {number} lastByte - last byte of previous input, if it is being processed in chunks
     * @returns {string} - input with removed newlines
     * @memberof IO
     */
    public static processNewlines(original: string, lastByte?: number): string {
        ImperativeExpect.toNotBeNullOrUndefined(original, "Required parameter 'original' must not be null or undefined");
        if (os.platform() !== IO.OS_WIN32) {
            return original;
        }
        // otherwise, we're on windows
        const processed = original.replace(/([^\r])\n/g, "$1\r\n");
        if ((lastByte == null || lastByte !== "\r".charCodeAt(0)) && original.startsWith("\n")) {
            return "\r" + processed;
        }
        return processed;
    }

    /**
     * Get default text editor for a given operating system
     * @static
     * @returns {string} - text editor launch string
     * @memberof IO
     */
    public static getDefaultTextEditor(): string {
        const platform = os.platform();
        if (platform === IO.OS_WIN32) {
            return "notepad";
        } else if (platform === IO.OS_MAC) {
            return "open -a TextEdit";
        } else if (platform === IO.OS_LINUX) {
            return "vi";
        }
    }

    /**
     * Create a file
     * @static
     * @param  {string} file - file to create
     * @memberof IO
     */
    public static createFileSync(file: string) {
        ImperativeExpect.toBeDefinedAndNonBlank(file, "file");
        fs.closeSync(fs.openSync(file, "w"));
    }

    /**
     * Set file access permissions so that only the current user will have access to the file.
     * On windows, it means "full control" for the current user.
     * On posix, it means read & write access for the current user.
     * Obviously, the current user must have permission to change permissions
     * on the specified file.
     *
     * @param  {string} fileName - file name for which we modify access.
     * @throws An ImperativeError when the operation fails.
     */
    public static giveAccessOnlyToOwner(fileName: string) {
        ImperativeExpect.toBeDefinedAndNonBlank(fileName, "fileName");
        try {
            if (!IO.existsSync(fileName))
            {
                throw new Error("Attempted to restrict access on a non-existent file.");
            }
            if (os.platform() === IO.OS_WIN32) {
                // On windows, we use an icacls command to prevent access
                const stdout = ExecUtils.spawnAndGetOutput("icacls",
                    [ fileName, "/inheritancelevel:r", "/grant:r", `${os.userInfo().username}:F`, "/c" ],
                    { encoding: "utf8"}
                );
                if (!stdout.includes("Successfully processed 1 files; Failed processing 0 files")) {
                    throw new Error(`icacls reports that it could not change file access:\n${stdout}`);
                }
            } else { // we are on Posix
                // give read & write permissions to owner
                let ownerPrivileges = fs.constants.S_IRUSR | fs.constants.S_IWUSR;

                // give execute permission, if owner had it before
                if (fs.statSync(fileName).mode & fs.constants.S_IXUSR) {
                    ownerPrivileges |= fs.constants.S_IXUSR;
                }
                fs.chmodSync(fileName, ownerPrivileges);
            }
        } catch(errObj) {
            throw new ImperativeError({
                msg: `Failed to restrict access to others on file = ${fileName}\nError Details: ${errObj.message}`
            });
        }
    }

    /**
     * Create a file asynchronously
     * @static
     * @param  {string} file    - file to create
     * @param  {string} content - content to write in the file
     * @return {[type]}         [description]
     * @memberof IO
     */
    public static writeFileAsync(file: string, content: string) {
        ImperativeExpect.toBeDefinedAndNonBlank(file, "file");
        ImperativeExpect.toNotBeNullOrUndefined(content, "Content to write to the file must not be null or undefined");
        return new Promise<void>((resolve, reject: ImperativeReject) => {
            fs.writeFile(file, content, IO.UTF8, (err) => {
                if (err != null) {
                    reject(new ImperativeError({msg: err.message}));
                }
                resolve();
            });
        });
    }

    /**
     * Write a file
     * @static
     * @param  {string} file - file to create
     * @param  {string} content    - content to write
     * @return {undefined}
     * @memberof IO
     */
    public static writeFile(file: string, content: Buffer) {
        ImperativeExpect.toBeDefinedAndNonBlank(file, "file");
        ImperativeExpect.toNotBeNullOrUndefined(content, "Content to write to the file must not be null or undefined");
        const fd = fs.openSync(file, "w");
        try {
            fs.writeFileSync(fd, content);
        } finally {
            fs.closeSync(fd);
        }
    }

    /**
     * Write an object to a file and set consistent formatting on the serialized
     * JSON object.
     * @static
     * @param  {string} configFile - file to create
     * @param  {Object} object     - object to serialize
     * @return {undefined}
     * @memberof IO
     */
    public static writeObject(configFile: string, object: object) {
        ImperativeExpect.toBeDefinedAndNonBlank(configFile, "configFile");
        ImperativeExpect.toNotBeNullOrUndefined(object, "content");
        const fd = fs.openSync(configFile, "w");
        try {
            fs.writeFileSync(fd, JSON.stringify(object, null, 2));
        } finally {
            fs.closeSync(fd);
        }
    }

    /**
     * Delete a file
     * @static
     * @param {string} file: The file to delete
     * @memberof IO
     */
    public static deleteFile(file: string) {
        ImperativeExpect.toBeDefinedAndNonBlank(file, "file");
        if (fs.existsSync(file)) {
            fs.unlinkSync(file);
        }
    }

    /**
     * Delete a directory
     * @static
     * @param {string} dir: The directory to delete
     * @memberof IO
     */
    public static deleteDir(dir: string) {
        ImperativeExpect.toBeDefinedAndNonBlank(dir, "dir");
        fs.rmdirSync(dir);
    }

    /**
     * Recursively delete all files and subdirectories of the specified directory.
     * Ensure that we do not follow a symlink. Just delete the link.
     *
     * @params {string} pathToTreeToDelete - Path to top directory of the tree
     *      to delete.
     */
    public static deleteDirTree(pathToTreeToDelete: string) {
        try {
            // if pathToTreeToDelete is a symlink, just delete the link file
            if (fs.existsSync(pathToTreeToDelete)) {
                const fileStats = fs.lstatSync(pathToTreeToDelete);
                if (fileStats.isSymbolicLink() || fileStats.isFile()) {
                    fs.unlinkSync(pathToTreeToDelete);
                    return;
                }

                // read all of the children of this directory
                fs.readdirSync(pathToTreeToDelete).forEach((nextChild) => {
                    // recursively delete the child
                    IO.deleteDirTree(pathToTreeToDelete + path.sep + nextChild);
                });

                // delete our starting directory
                fs.rmdirSync(pathToTreeToDelete);
            }
        } catch (exception) {
            throw new ImperativeError({
                msg: "Failed to delete the directory tree '" + pathToTreeToDelete +
                        "'\nReason: " + exception.message + "\n" +
                        "Full exception: " + exception
            }
            );
        }
    }

    /**
     * Delete a symbolic link.
     *
     * @param {string} symLinkPath - the path to a symbolic link to be deleted
     */
    public static deleteSymLink(symLinkPath: string) {
        try {
            if (!fs.existsSync(symLinkPath)) {
                return;
            }

            // Get the file status to determine if it is a symlink.
            const fileStats = fs.lstatSync(symLinkPath);
            if (fileStats.isSymbolicLink()) {
                fs.unlinkSync(symLinkPath);
                return;
            }
        } catch (ioExcept) {
            throw new ImperativeError({
                msg: "Failed to delete the symbolic link '" + symLinkPath +
                        "'\nReason: " + ioExcept.message + "\n" +
                        "Full exception: " + ioExcept
            }
            );
        }

        throw new ImperativeError({
            msg: "The specified symlink '" + symLinkPath +
                    "' already exists and is not a symbolic link. So, we did not delete it."
        }
        );
    }
}
