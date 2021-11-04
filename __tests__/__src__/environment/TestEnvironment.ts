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

import * as nodePath from "path";

import { AbstractSession, Session } from "@zowe/imperative";

import { ITestPropertiesSchema } from "../properties/ITestPropertiesSchema";
import { ISetupEnvironmentParms, ITestEnvironment, TestEnvironment as BaseTestEnvironment } from "../../__packages__/cli-test-utils";
import { SshSession } from "../../../packages/zosuss/src/SshSession";

/**
 * Use the utility methods here to setup the test environment for running APIs
 * and CLIs. Imperative will always touch the filesystem in some capacity
 * and these utilties help containerize the tests.
 * @export
 * @class TestEnvironment
 */
export class TestEnvironment extends BaseTestEnvironment {
    /**
     * Integration tests (tests that will perform an Imperative init, use the filesystem, etc) should invoke this method
     * as part of the Jest describes "beforeAll()" method. This method creates a unique test environment to enable
     * parallel execution of tests and to provide an isolated working directory for any filesystem manipulation that
     * needs to occur.
     * @static
     * @param {ISetupEnvironmentParms} params - See the interface for parameter details.
     * @returns {Promise<ITestEnvironment>}
     * @memberof TestEnvironment
     */
    public static async setUp(params: ISetupEnvironmentParms): Promise<ITestEnvironment<ITestPropertiesSchema>> {
        const result = await super.setUp(params);

        // Ensure correct path separator for windows or linux like systems.
        const separator = process.platform === "win32" ? ";" : ":";
        result.env.PATH = `${process.env.PATH}${separator}${nodePath.resolve(__dirname, "../../__resources__/application_instances")}`;

        // Return the test environment including working directory that the tests should be using
        return result;
    }

    /**
     * Create a ZOSMF session from properties present in your test environment
     * @param testEnvironment - your test environment with system test properties populated
     */
    public static createZosmfSession(testEnvironment: ITestEnvironment<ITestPropertiesSchema>): Session {
        const SYSTEM_PROPS = testEnvironment.systemTestProperties;
        return new Session({
            user: SYSTEM_PROPS.zosmf.user,
            password: SYSTEM_PROPS.zosmf.password,
            hostname: SYSTEM_PROPS.zosmf.host,
            port: SYSTEM_PROPS.zosmf.port,
            type: "basic",
            rejectUnauthorized: SYSTEM_PROPS.zosmf.rejectUnauthorized,
            basePath: SYSTEM_PROPS.zosmf.basePath
        });
    }

    /**
     * Create a ZOSMF session through the APIML from properties present in your test environment
     * @param testEnvironment - your test environment with system test properties populated
     */
    public static createBaseSession(testEnvironment: ITestEnvironment<ITestPropertiesSchema>): AbstractSession {
        const SYSTEM_PROPS = testEnvironment.systemTestProperties;
        return new Session({
            user: SYSTEM_PROPS.base.user,
            password: SYSTEM_PROPS.base.password,
            hostname: SYSTEM_PROPS.base.host,
            port: SYSTEM_PROPS.base.port,
            type: "token",
            tokenType: "apimlAuthenticationToken",
            rejectUnauthorized: SYSTEM_PROPS.base.rejectUnauthorized
        });
    }

    /**
     * Create a SSH session from properties present in your test environment
     * @param testEnvironment - your test environment with system test properties populated
     */
    public static createSshSession(testEnvironment: ITestEnvironment<ITestPropertiesSchema>): SshSession {
        const defaultSystem = testEnvironment.systemTestProperties;
        return new SshSession({
            user: defaultSystem.ssh.user,
            password: defaultSystem.ssh.password,
            hostname: defaultSystem.ssh.host,
            port: defaultSystem.ssh.port,
            privateKey: defaultSystem.ssh.privateKey,
            keyPassphrase: defaultSystem.ssh.keyPassphrase,
            handshakeTimeout: defaultSystem.ssh.handshakeTimeout
        });
    }
}
