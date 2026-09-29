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

import { transports } from "winston";
import { log4jsConfigToWinstonConfig } from "../src/log4jsToWinston";

describe("log4jsConfigToWinstonConfig tests", () => {
    it("Should pass the appender's file mode through to the winston File transport", () => {
        const log4jsConfig = {
            appenders: {
                sampleFile: {
                    type: "fileSync",
                    filename: "./someHome/logs/sampleFile.log",
                    mode: 0o600,
                }
            }
        };

        const winstonConfig = log4jsConfigToWinstonConfig(log4jsConfig, "WARN", ["sampleFile"]);

        const winstonTransports = winstonConfig.transports as any[];
        expect(winstonTransports).toHaveLength(1);
        const fileTransport = winstonTransports[0] as InstanceType<typeof transports.File>;
        expect(fileTransport).toBeInstanceOf(transports.File);
        expect((fileTransport as any).options).toEqual({ flags: "a", mode: 0o600 });
    });

    it("Should not set file transport options when the appender has no mode", () => {
        const log4jsConfig = {
            appenders: {
                sampleFile: {
                    type: "fileSync",
                    filename: "./someHome/logs/sampleFile.log",
                }
            }
        };

        const winstonConfig = log4jsConfigToWinstonConfig(log4jsConfig, "WARN", ["sampleFile"]);

        const winstonTransports = winstonConfig.transports as any[];
        const fileTransport = winstonTransports[0] as InstanceType<typeof transports.File>;
        expect((fileTransport as any).options).toEqual({ flags: "a" });
    });
});
