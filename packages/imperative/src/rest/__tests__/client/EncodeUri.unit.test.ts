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

import { AbstractSession } from "../../src/session/AbstractSession";
import { EncodeUri } from "../../src/client/EncodeUri";
import { ImperativeError } from "../../../error/src/ImperativeError";
import { Session } from "../../src/session/Session";
import { ZosFilesConstants } from "../../../../../zosfiles/src/constants/ZosFiles.constants";

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

    describe("encUriPathForZos tests", () => {
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
    }); // end encUriPathForZos

    describe("encUriPathForUss tests", () => {
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

        it("should throw an error if a backslash is in a uss URI path", () => {
            const suppliedUri = ussBaseUri + "/some//dir/with\\a/backslash/test.txt";
            let error: ImperativeError = {} as ImperativeError;

            try {
                EncodeUri.encUriPathForUss(zosmfSession, suppliedUri);
            } catch (e) {
                error = e as ImperativeError;
            }

            expect(error).toBeDefined();
            expect(error.message).toEqual("The supplied USS path = " +
                "'/zosmf/restfiles/fs/some//dir/with\\a/backslash/test.txt' contains a backslash \\ character. " +
                "When a backslash is present, both z/OSMF and API-ML servers fail with an HTTP 400 or 500 error code, " +
                "or the backslash is ignored. Therefore, this request was not sent."
            );
        });

        it("should throw an error if a doublequote is in a uss URI path", () => {
            const suppliedUri = ussBaseUri + "/some//dir/with\"a/doublequote/test.txt";
            let error: ImperativeError = {} as ImperativeError;

            try {
                EncodeUri.encUriPathForUss(zosmfSession, suppliedUri);
            } catch (e) {
                error = e as ImperativeError;
            }

            expect(error).toBeDefined();
            expect(error.message).toEqual("The supplied USS path = " +
                "'/zosmf/restfiles/fs/some//dir/with\"a/doublequote/test.txt' contains a double-quote \" character. " +
                "When a double-quote is present, both z/OSMF and API-ML servers fail with an HTTP 400 or 500 error code. " + "Therefore, this request was not sent."
            );
        });
    }); // end encUriPathForUss

    describe("encUriQueryForUss tests", () => {
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

    describe("shouldEncodeForApiml tests", () => {
        it("should return false if a null session object is supplied", () => {
            // using class["name"] notation because it is a private static function
            const isApiml = EncodeUri["shouldEncodeForApiml"](null as unknown as AbstractSession);
            expect(isApiml).toBe(false);
        });
    });
});
