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

import { LoggerUtils } from "../../logger";

describe("LoggerUtils tests", () => {

    it("Should hide --password operand", () => {
        const data = LoggerUtils.censorCLIArgs(["--password", "cantSeeMe"]);
        expect(data).toContain(LoggerUtils.CENSOR_RESPONSE);
    });

    it("Should hide --token-value operand", () => {
        const data = LoggerUtils.censorCLIArgs(["--token-value", "cantSeeMe"]);
        expect(data).toContain(LoggerUtils.CENSOR_RESPONSE);
    });

    it("Should hide --cert-file-passphrase operand", () => {
        const data = LoggerUtils.censorCLIArgs(["--cert-file-passphrase", "cantSeeMe"]);
        expect(data).toContain(LoggerUtils.CENSOR_RESPONSE);
    });

    it("Should hide --authentication operand", () => {
        const data = LoggerUtils.censorCLIArgs(["--authentication", "cantSeeMe"]);
        expect(data).toContain(LoggerUtils.CENSOR_RESPONSE);
    });

    it("Should hide -p operand", () => {
        const data = LoggerUtils.censorCLIArgs(["-p", "cantSeeMe"]);
        expect(data).toContain(LoggerUtils.CENSOR_RESPONSE);
    });

    it("Should not hide --not-secret operand", () => {
        const data = LoggerUtils.censorCLIArgs(["--not-secret", "canSeeMe"]);
        expect(data).not.toContain(LoggerUtils.CENSOR_RESPONSE);
    });

    it("Should hide password operand", () => {
        const data = LoggerUtils.censorYargsArguments({ _: [], $0: "test", password: "cantSeeMe" });
        expect(data.password).toContain(LoggerUtils.CENSOR_RESPONSE);
    });

    it("Should not hide notSecret operand", () => {
        const data = LoggerUtils.censorYargsArguments({_: [], $0: "test", notSecret: "canSeeMe"});
        expect(data.notSecret).not.toContain(LoggerUtils.CENSOR_RESPONSE);
    });
});
