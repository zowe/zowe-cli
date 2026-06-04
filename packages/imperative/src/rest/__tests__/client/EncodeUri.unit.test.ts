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

import { EncodeUri } from "../../src/client/EncodeUri";
import { ZosFilesConstants } from "../../../../../zosfiles/src/constants/ZosFiles.constants";

describe("EncodeUri tests", () => {
    const ussBaseUri = ZosFilesConstants.RESOURCE + ZosFilesConstants.RES_USS_FILES;
    const ussSpecialChars = "-=? +|~{}<>\\,.!;:'\"[]&%$#@^*_";

    it("should encode nothing for a zos URI path", () => {
        const suppliedUri = ZosFilesConstants.RESOURCE + ZosFilesConstants.RES_DS_FILES +
            "/-(VOL99)/ALPHA.12345.JCL(T@#$-EST)";

        const encodedUri = EncodeUri.encUriPathForZos(suppliedUri);
        expect(encodedUri).toEqual(suppliedUri);
    });

    it("should encode numerous special characters for a uss URI path", () => {
        // Note that the JavaScript EncodeUri() function leaves the + and ? character unencoded.
        // In manual testing, whether encoded or unencoded, zosmf does the following with those characters:
        // The resulting file name has a space in the place of the + character.
        // The resulting file name is truncated starting with the location of the ? character.
        const normalUriChars = ussBaseUri + "/some/dir/file";
        const suppliedUri = normalUriChars + ussSpecialChars;
        const expectedUri = normalUriChars + "-=%3F%20%2B%7C~%7B%7D%3C%3E%5C,.!;:'%22%5B%5D&%25$#@%5E*_";

        const encodedUri = EncodeUri.encUriPathForUss(suppliedUri);
        expect(encodedUri).toEqual(expectedUri);
    });

    it("should eliminate multiple forward slash characters for a uss URI path", () => {
        const suppliedUri = ussBaseUri + "/" + "/some//dir/with////multiple//slashes/subDir/../test.txt";
        const expectedUri = ussBaseUri + "/some/dir/with/multiple/slashes/test.txt";

        const encodedUri = EncodeUri.encUriPathForUss(suppliedUri);
        expect(encodedUri).toEqual(expectedUri);
    });

    it("should encode more special characters for a uss query string", () => {
        const suppliedQuery = "test" + ussSpecialChars;
        const expectedQuery = "test" + "-%3D%3F%20%2B%7C~%7B%7D%3C%3E%5C%2C.!%3B%3A'%22%5B%5D%26%25%24%23%40%5E*_";
        const suppliedUriPath = ussBaseUri + "/some/dir/";
        const expectedUriPath = suppliedUriPath;

        const encodedUri = EncodeUri.encUriPathForUss(suppliedUriPath) + "?" +
            EncodeUri.encUriQueryForUss(suppliedQuery);
        expect(encodedUri).toEqual(`${expectedUriPath}?${expectedQuery}`);
    });
});
