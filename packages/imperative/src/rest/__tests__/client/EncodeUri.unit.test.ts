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
import { Session } from "../../src/session/Session";

describe("EncodeUri tests", () => {
    const ussBaseUri = ZosFilesConstants.RESOURCE + ZosFilesConstants.RES_USS_FILES;
    const ussSpecialChars = "-=~,.!:'&$@*_% +?#;<>[]^{|}";

    const zosmfSession = new Session({
        hostname: "fakeHost"
    });

    const apimlSession = new Session({
        hostname: "fakeHost",
        basePath: "basePath_means_apiml"
    });

    it("should encode no special characters for a zos URI path with zosmf", () => {
        const zosBaseUri = ZosFilesConstants.RESOURCE + ZosFilesConstants.RES_USS_FILES;
        const zosSpecialChars = "@$-#";
        const suppliedUri = zosBaseUri + `/-(VOL99)/ALPHA.12345.JCL(TEST${zosSpecialChars})`;

        const encodedUri = EncodeUri.encUriPathForZos(zosmfSession, suppliedUri);
        expect(encodedUri).toEqual(suppliedUri);
    });

    it("should encode only # for a zos URI path with apiml", () => {
        const zosBaseUri = ZosFilesConstants.RESOURCE + ZosFilesConstants.RES_USS_FILES;
        const zosSpecialChars = "@$-#";
        const suppliedUri = zosBaseUri + `/-(VOL99)/ALPHA.12345.JCL(TEST${zosSpecialChars})`;
        const expectedUri = zosBaseUri + "/-(VOL99)/ALPHA.12345.JCL(TEST@$-%23)";

        const encodedUri = EncodeUri.encUriPathForZos(apimlSession, suppliedUri);
        expect(encodedUri).toEqual(expectedUri);
    });

    it("should encode a small subset of special characters for a uss URI path with zosmf", () => {
        const normalUriChars = ussBaseUri + "/some/dir/file";
        const suppliedUri = normalUriChars + ussSpecialChars;
        const expectedUri = normalUriChars + "-=~,.!:'&$@*_%25%20%2B%3F#;<>[]^{|}";

        const encodedUri = EncodeUri.encUriPathForUss(zosmfSession, suppliedUri);
        expect(encodedUri).toEqual(expectedUri);
    });

    it("should encode a larger subset of special characters for a uss URI path with apiml", () => {
        const normalUriChars = ussBaseUri + "/some/dir/file";
        const suppliedUri = normalUriChars + ussSpecialChars;
        const expectedUri = normalUriChars + "-=~,.!:'&$@*_%25%20%2B%3F%23%3B%3C%3E%5B%5D%5E%7B%7C%7D";

        const encodedUri = EncodeUri.encUriPathForUss(apimlSession, suppliedUri);
        expect(encodedUri).toEqual(expectedUri);
    });

    it("should eliminate multiple forward slash characters for a uss URI path", () => {
        const suppliedUri = ussBaseUri + "/" + "/some//dir/with////multiple//slashes/subDir/../test.txt";
        const expectedUri = ussBaseUri + "/some/dir/with/multiple/slashes/test.txt";

        const encodedUri = EncodeUri.encUriPathForUss(zosmfSession, suppliedUri);
        expect(encodedUri).toEqual(expectedUri);
    });

    it("should encode more special characters for a uss query string", () => {
        const suppliedUriPath = ussBaseUri + "/some/dir/";
        const expectedUriPath = suppliedUriPath;
        const suppliedQuery = "test" + ussSpecialChars;
        const expectedQuery = "test" + "-%3D~%2C.!%3A'%26%24%40*_%25%20%2B%3F%23%3B%3C%3E%5B%5D%5E%7B%7C%7D";

        const encodedUri = EncodeUri.encUriPathForUss(zosmfSession, suppliedUriPath) + "?" +
            EncodeUri.encUriQueryForUss(suppliedQuery);
        expect(encodedUri).toEqual(`${expectedUriPath}?${expectedQuery}`);
    });
});
