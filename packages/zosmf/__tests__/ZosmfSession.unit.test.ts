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

import { ZosmfSession } from "../src/ZosmfSession";
import { Session } from "@brightside/imperative";

describe("zosmf utils", () => {
    it("should create a session object", () => {
        const session: Session = ZosmfSession.createBasicZosmfSession({
            host: "fake",
            port: "fake",
            user: "fake",
            password: "fake",
            auth: "fake",
            rejectUnauthorized: "fake",
        });
        expect(session.ISession).toMatchSnapshot();
    });
});
