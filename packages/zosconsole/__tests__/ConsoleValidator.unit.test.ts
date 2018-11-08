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

import { ConsoleValidator, ICollectParms, IIssueParms, IZosmfIssueParms } from "../../zosconsole";
import { Session } from "@brightside/imperative";

const CONSOLE_NAME: string = "CN12345";
const RESPONSE_KEY: string = "C9876543";
const IPLINFO: string = "D IPLINFO";

const PRETEND_SESSION = new Session({
    user: "user",
    password: "password",
    hostname: "host.com",
    port: 443,
    type: "basic",
    rejectUnauthorized: false,
});

const ZOSMF_ISSUE_PARAMETERS: IZosmfIssueParms = {
    cmd: "command",
    solKey: "solkey",
    system: "sys1",
};

const ISSUE_PARAMETERS: IIssueParms = {
    command: IPLINFO,
};

const COLLECT_PARAMETERS: ICollectParms = {
    commandResponseKey: RESPONSE_KEY,
    followUpAttempts: 2,
    waitToCollect: 2,
};

describe("ConsoleValidator", () => {

    describe("validateCommonParms", () => {
        it("should correctly validate common parameters", () => {
            let error;
            try {
                ConsoleValidator.validateCommonParms(PRETEND_SESSION, CONSOLE_NAME, ZOSMF_ISSUE_PARAMETERS);
            }
            catch (e) {
                error = e;
            }
            expect(error).toBeUndefined();
        });

        it("should fail validating empty session", () => {
            let error;
            try {
                ConsoleValidator.validateCommonParms(undefined, CONSOLE_NAME, ZOSMF_ISSUE_PARAMETERS);
            }
            catch (e) {
                error = e;
            }
            expect(error).toBeDefined();
            expect(error.toString()).toMatchSnapshot();
        });

        it("should fail validating empty console name", () => {
            let error;
            try {
                ConsoleValidator.validateCommonParms(PRETEND_SESSION, undefined, ZOSMF_ISSUE_PARAMETERS);
            }
            catch (e) {
                error = e;
            }
            expect(error).toBeDefined();
            expect(error.toString()).toMatchSnapshot();
        });

        it("should fail validating empty common parameters", () => {
            let error;
            try {
                ConsoleValidator.validateCommonParms(PRETEND_SESSION, CONSOLE_NAME, undefined);
            }
            catch (e) {
                error = e;
            }
            expect(error).toBeDefined();
            expect(error.toString()).toMatchSnapshot();
        });
    });

    describe("validateIssueParms", () => {
        it("should correctly validate parameters for issue command", () => {
            let error;
            try {
                ConsoleValidator.validateIssueParms(PRETEND_SESSION, ISSUE_PARAMETERS);
            }
            catch (e) {
                error = e;
            }
            expect(error).toBeUndefined();
        });

        it("should fail validating with no session", () => {
            let error;
            try {
                ConsoleValidator.validateIssueParms(undefined, ISSUE_PARAMETERS);
            }
            catch (e) {
                error = e;
            }
            expect(error).toBeDefined();
            expect(error.toString()).toMatchSnapshot();
        });

        it("should fail validating undefined parameters", () => {
            let error;
            try {
                ConsoleValidator.validateIssueParms(PRETEND_SESSION, undefined);
            }
            catch (e) {
                error = e;
            }
            expect(error).toBeDefined();
            expect(error.toString()).toMatchSnapshot();
        });
    });

    describe("validateIssueSimpleParms", () => {
        it("should correctly validate session and a command", () => {
            let error;
            try {
                ConsoleValidator.validateIssueSimpleParms(PRETEND_SESSION, IPLINFO);
            }
            catch (e) {
                error = e;
            }
            expect(error).toBeUndefined();
        });

        it("should fail validating with no session", () => {
            let error;
            try {
                ConsoleValidator.validateIssueSimpleParms(undefined, IPLINFO);
            }
            catch (e) {
                error = e;
            }
            expect(error).toBeDefined();
            expect(error.toString()).toMatchSnapshot();
        });

        it("should fail validating an undefined command", () => {
            let error;
            try {
                ConsoleValidator.validateIssueSimpleParms(PRETEND_SESSION, undefined);
            }
            catch (e) {
                error = e;
            }
            expect(error).toBeDefined();
            expect(error.toString()).toMatchSnapshot();
        });
    });

    describe("validateCollectParm", () => {
        it("should correctly validate the parameters for collect response command", () => {
            let error;
            try {
                ConsoleValidator.validateCollectParm(COLLECT_PARAMETERS);
            }
            catch (e) {
                error = e;
            }
            expect(error).toBeUndefined();
        });

        it("should fail validating without parameters", () => {
            let error;
            try {
                ConsoleValidator.validateCollectParm(undefined);
            }
            catch (e) {
                error = e;
            }
            expect(error).toBeDefined();
            expect(error.toString()).toMatchSnapshot();
        });
    });

    describe("validateIssueParm", () => {
        it("should correctly validate the parameters for issue command", () => {
            let error;
            try {
                ConsoleValidator.validateIssueParm(ISSUE_PARAMETERS);
            }
            catch (e) {
                error = e;
            }
            expect(error).toBeUndefined();
        });

        it("should fail validating without any parameters specified", () => {
            let error;
            try {
                ConsoleValidator.validateIssueParm(undefined);
            }
            catch (e) {
                error = e;
            }
            expect(error).toBeDefined();
            expect(error.toString()).toMatchSnapshot();
        });
    });

    describe("validateCollectCommonParms", () => {
        it("should correctly validate common parameters for collecting responses", () => {
            let error;
            try {
                ConsoleValidator.validateCollectCommonParms(PRETEND_SESSION, CONSOLE_NAME, RESPONSE_KEY);
            }
            catch (e) {
                error = e;
            }
            expect(error).toBeUndefined();
        });

        it("should throw an error with no session passed", () => {
            let error;
            try {
                ConsoleValidator.validateCollectCommonParms(undefined, CONSOLE_NAME, RESPONSE_KEY);
            }
            catch (e) {
                error = e;
            }
            expect(error).toBeDefined();
            expect(error.toString()).toMatchSnapshot();
        });

        it("should throw an error validating empty console name", () => {
            let error;
            try {
                ConsoleValidator.validateCollectCommonParms(PRETEND_SESSION, undefined, RESPONSE_KEY);
            }
            catch (e) {
                error = e;
            }
            expect(error).toBeDefined();
            expect(error.toString()).toMatchSnapshot();
        });

        it("should throw an error with an empty command response key", () => {
            let error;
            try {
                ConsoleValidator.validateCollectCommonParms(PRETEND_SESSION, CONSOLE_NAME, undefined);
            }
            catch (e) {
                error = e;
            }
            expect(error).toBeDefined();
            expect(error.toString()).toMatchSnapshot();
        });
    });

    describe("validateCollectParms", () => {
        it("should correctly validate session and collect parameters", () => {
            let error;
            try {
                ConsoleValidator.validateCollectParms(PRETEND_SESSION, COLLECT_PARAMETERS);
            }
            catch (e) {
                error = e;
            }
            expect(error).toBeUndefined();
        });

        it("should fail validating with an empty session", () => {
            let error;
            try {
                ConsoleValidator.validateCollectParms(undefined, COLLECT_PARAMETERS);
            }
            catch (e) {
                error = e;
            }
            expect(error).toBeDefined();
            expect(error.toString()).toMatchSnapshot();
        });

        it("should fail validating undefined collecting parameters", () => {
            let error;
            try {
                ConsoleValidator.validateCollectParms(PRETEND_SESSION, undefined);
            }
            catch (e) {
                error = e;
            }
            expect(error).toBeDefined();
            expect(error.toString()).toMatchSnapshot();
        });
    });
});
