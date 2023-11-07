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

import * as os from "os";
import * as path from "path";
import { LoggingConfigurer } from "../../../src";

jest.mock("path");

const fakeHome = "./someHome";
const name = "sample";

describe("LoggingConfigurer tests", () => {
    beforeAll(() => {
        jest.spyOn(os, "homedir").mockImplementation(() => fakeHome);
        jest.spyOn(path, "normalize").mockImplementation((p: string) => p);
    });

    afterAll(() => {
        jest.restoreAllMocks();
    });

    it("Should reject configurations that don't contain a \"name\" field", () => {
        expect(() => {
            LoggingConfigurer.configureLogger(fakeHome, {});
        }).toThrowErrorMatchingSnapshot();
    });
    it("Should return a complete IConfigLogging object based on no IImperativeConfig input", () => {
        const config = LoggingConfigurer.configureLogger(fakeHome, {name});
        expect(config).toMatchSnapshot();
    });

    it("Should return a complete IConfigLogging object based on custom name in IImperativeConfig input", () => {
        const config = LoggingConfigurer.configureLogger(fakeHome, {name: "notSample"});
        expect(config).toMatchSnapshot();
    });

    it("Should return a complete IConfigLogging object based on custom imperative log level in IImperativeConfig input", () => {
        const config = LoggingConfigurer.configureLogger(fakeHome, {
            logging: {
                imperativeLogging: {
                    level: "trace"
                }
            },
            name
        });
        expect(config).toMatchSnapshot();
    });

    it("Should return a complete IConfigLogging object based on custom app log level and log file in IImperativeConfig input", () => {
        const config = LoggingConfigurer.configureLogger(fakeHome, {
            logging: {
                imperativeLogging: {
                    level: "trace"
                },
                appLogging: {
                    logFile: "different/location/log.txt",
                    level: "fatal"
                }
            },
            name
        });
        expect(config).toMatchSnapshot();
    });

    it("Should return a complete IConfigLogging object based on custom app, imperative, and additional logging in IImperativeConfig input", () => {
        const config = LoggingConfigurer.configureLogger(fakeHome, {
            logging: {
                imperativeLogging: {
                    level: "trace"
                },
                appLogging: {
                    logFile: "different/location/log.txt",
                    level: "fatal"
                },
                additionalLogging: [
                    {
                        apiName: "extraOne",
                    },
                    {
                        apiName: "extraTwo",
                        level: "info",
                        logFile: "/to/the/moon.log"
                    }
                ],
            },
            name
        });
        expect(config).toMatchSnapshot();
    });

    it("Should return a complete IConfigLogging object based on no logging, but using logging keyword in IImperativeConfig input", () => {
        const config = LoggingConfigurer.configureLogger(fakeHome, {
            logging: {
                // intentionally empty
            },
            name
        });
        expect(config).toMatchSnapshot();
    });

    it("Should error for missing API name in additional loggers", () => {
        const expectErrorMsg = "apiName is required for additionalLoggers";
        let errorMsg = "";
        try {
            LoggingConfigurer.configureLogger(fakeHome, {
                logging: {
                    additionalLogging: [
                        {
                            level: "trace"
                        }
                    ],
                },
                name
            });
        } catch (error) {
            errorMsg = error.message;
        }

        expect(errorMsg).toBe(expectErrorMsg);
    });

    it("Should error invalid level", () => {
        const expectErrorMsg = "Invalid level specified";
        let errorMsg = "";
        try {
            LoggingConfigurer.configureLogger(fakeHome, {
                logging: {
                    appLogging:
                        {
                            level: "notReal"
                        }
                },
                name
            });
        } catch (error) {
            errorMsg = error.message;
        }

        expect(errorMsg).toBe(expectErrorMsg);
    });

    it("Should error invalid level on app or imperative too", () => {
        const expectErrorMsg = "Invalid level specified";
        let errorMsg = "";
        try {
            LoggingConfigurer.configureLogger(fakeHome, {
                logging: {
                    imperativeLogging: {
                        level: "extreme",
                    }
                },
                name
            });
        } catch (error) {
            errorMsg = error.message;
        }

        expect(errorMsg).toBe(expectErrorMsg);
    });


    it("Should not be able to change api name for imperative or app", () => {
        const config = LoggingConfigurer.configureLogger(fakeHome, {
            logging: {
                imperativeLogging: {
                    apiName: "cantChangeThisItWillStillBeImperative"
                },
                appLogging: {
                    apiName: "cantChangeThisItWillStillBeApp"
                }
            },
            name
        });

        expect(config).toMatchSnapshot();
    });
});
