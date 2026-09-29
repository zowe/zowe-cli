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

import { ImperativeError } from "@zowe/imperative";
import { JobsUtils } from "../../src/JobsUtils";

describe("JobsUtils", () => {
    // Values that could change the path of a z/OSMF REST request if they were accepted
    const pathManipulationValues = [
        "../../restfiles/ds/SYS1.PARMLIB(IEASYS00)",
        "JOB1/../../../../zosmf/restfiles/ds/PROD.APP.CONFIG",
        "..",
        ".",
        "JOB1/",
        "JOB1\\..",
        "JOB1?mode=binary",
        "JOB1%2F..%2F..",
        "%2e%2e",
        "JOB1;",
        "JOB1&x=y",
        "JOB 1",
        "JOB1\r\n",
        ""
    ];

    describe("validateJobNameAndId", () => {
        it.each([
            ["MYJOB1", "JOB00001"],
            ["IBMUSER$", "TSU12345"],
            ["#JOB@1", "STC00042"],
            ["$", "J0123456"],
            ["testjob", "j12345"]
        ])("should accept job name '%s' and job ID '%s'", (jobname, jobid) => {
            expect(() => JobsUtils.validateJobNameAndId(jobname, jobid)).not.toThrow();
        });

        it.each(pathManipulationValues)("should reject job name '%s'", (jobname) => {
            let err: ImperativeError;
            try {
                JobsUtils.validateJobNameAndId(jobname, "JOB00001");
            } catch (e) {
                err = e;
            }
            expect(err).toBeInstanceOf(ImperativeError);
            expect(err.message).toBe(`The job name '${jobname}' is not valid. ` +
                "A job name can contain only letters, numbers, and the national characters @, #, and $.");
        });

        it.each([...pathManipulationValues, "JOB#1", "JOB$1", "JOB@1"])("should reject job ID '%s'", (jobid) => {
            let err: ImperativeError;
            try {
                JobsUtils.validateJobNameAndId("MYJOB1", jobid);
            } catch (e) {
                err = e;
            }
            expect(err).toBeInstanceOf(ImperativeError);
            expect(err.message).toBe(`The job ID '${jobid}' is not valid. A job ID can contain only letters and numbers.`);
        });

        it.each([undefined, null, 123, ["JOB1"]])("should reject a job name or job ID that is not a string: %p", (value: any) => {
            expect(() => JobsUtils.validateJobNameAndId(value, "JOB00001")).toThrow("The job name");
            expect(() => JobsUtils.validateJobNameAndId("MYJOB1", value)).toThrow("The job ID");
        });
    });

    describe("validateSpoolId", () => {
        it.each([0, 1, 42, "3" as any])("should accept spool file ID %p", (spoolId: number) => {
            expect(() => JobsUtils.validateSpoolId(spoolId)).not.toThrow();
        });

        it.each([
            -1, 1.5, NaN, Infinity, undefined, null, "", "1/../../../../zosmf/restfiles/ds/PROD.APP.CONFIG", "1?x=y"
        ] as any[])("should reject spool file ID %p", (spoolId: number) => {
            let err: ImperativeError;
            try {
                JobsUtils.validateSpoolId(spoolId);
            } catch (e) {
                err = e;
            }
            expect(err).toBeInstanceOf(ImperativeError);
            expect(err.message).toContain("is not valid. A spool file ID must be a non-negative integer.");
        });
    });
});
