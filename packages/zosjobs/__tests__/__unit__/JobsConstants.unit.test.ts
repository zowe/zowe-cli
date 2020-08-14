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

import { JobsConstants } from "../../../zosjobs";

describe("JobsConstants tests", () => {

    it("should get an error for unexpected constant changes", () => {
        expect(JobsConstants.COMBO_ID).toMatchSnapshot();
        expect(JobsConstants.DEFAULT_MAX_JOBS).toMatchSnapshot();
        expect(JobsConstants.DEFAULT_PREFIX).toMatchSnapshot();
        expect(JobsConstants.QUERY_ID).toMatchSnapshot();
        expect(JobsConstants.QUERY_JOBID).toMatchSnapshot();
        expect(JobsConstants.QUERY_MAX_JOBS).toMatchSnapshot();
        expect(JobsConstants.QUERY_OWNER).toMatchSnapshot();
        expect(JobsConstants.QUERY_PREFIX).toMatchSnapshot();
        expect(JobsConstants.RESOURCE).toMatchSnapshot();
        expect(JobsConstants.RESOURCE_JCL_CONTENT).toMatchSnapshot();
        expect(JobsConstants.RESOURCE_SPOOL_CONTENT).toMatchSnapshot();
        expect(JobsConstants.RESOURCE_SPOOL_FILES).toMatchSnapshot();
        expect(JobsConstants.STEP_DATA).toMatchSnapshot();
    });

});
