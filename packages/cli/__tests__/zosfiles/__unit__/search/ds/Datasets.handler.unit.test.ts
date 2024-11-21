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


import { Search } from "@zowe/zos-files-for-zowe-sdk";
import { UNIT_TEST_ZOSMF_PROF_OPTS } from "../../../../../../../__tests__/__src__/TestConstants";
import { TaskStage } from "@zowe/imperative";

describe("Search Datasets handler", () => {
    describe("process method", () => {
        it("should search a data set if requested", async () => {
            // Require the handler and create a new instance
            const handlerReq = require("../../../../../src/zosfiles/search/ds/DataSets.handler");
            const handler = new handlerReq.default();
            const pattern = "TEST*";
            const searchString = "test";

            // Vars populated by the mocked function
            let apiMessage = "";
            let jsonObj;
            let logMessage = "";
            let fakeSession = null;

            // Mock the search datasets function
            Search.dataSets = jest.fn(async (session) => {
                fakeSession = session;
                return {
                    success: true,
                    commandResponse: "Found \"test\" in 2 data sets and PDS members",
                    apiResponse: [
                        {
                            dsn: "TEST1.DS",
                            member: "TESTMEM",
                            matchList: [
                                {
                                    line: 1,
                                    column: 1,
                                    contents: "TEST CONTENTS"
                                }
                            ]
                        },
                        {
                            dsn: "TEST2.DS",
                            member: undefined,
                            matchList: [
                                {
                                    line: 1,
                                    column: 1,
                                    contents: "TEST CONTENTS"
                                }
                            ]
                        }
                    ]
                };
            });

            // Invoke the handler with a full set of mocked arguments and response functions
            await handler.process({
                arguments: {
                    $0: "fake",
                    _: ["fake"],
                    pattern,
                    searchString,
                    ...UNIT_TEST_ZOSMF_PROF_OPTS
                },
                response: {
                    data: {
                        setMessage: jest.fn((setMsgArgs) => {
                            apiMessage = setMsgArgs;
                        }),
                        setObj: jest.fn((setObjArgs) => {
                            jsonObj = setObjArgs;
                        })
                    },
                    console: {
                        log: jest.fn((logArgs) => {
                            logMessage += "\n" + logArgs;
                        })
                    },
                    progress: {
                        startBar: jest.fn((parms) => {
                            // do nothing
                        }),
                        endBar: jest.fn(() => {
                            // do nothing
                        })
                    }
                }
            } as any);

            expect(Search.dataSets).toHaveBeenCalledTimes(1);
            expect(Search.dataSets).toHaveBeenCalledWith(fakeSession, {
                pattern,
                searchString,
                caseSensitive: undefined,
                getOptions: {
                    encoding: undefined
                },
                mainframeSearch: undefined,
                maxConcurrentRequests: undefined,
                timeout: undefined,
                progressTask: {
                    percentComplete: 0,
                    statusMessage: "Starting search...",
                    stageName: TaskStage.NOT_STARTED
                }
            });
            expect(jsonObj).toMatchSnapshot();
            expect(apiMessage).toMatchSnapshot();
            expect(logMessage).toMatchSnapshot();
        });

        it("should search a data set if requested - with case sensitive", async () => {
            // Require the handler and create a new instance
            const handlerReq = require("../../../../../src/zosfiles/search/ds/DataSets.handler");
            const handler = new handlerReq.default();
            const pattern = "TEST*";
            const searchString = "test";

            // Vars populated by the mocked function
            let apiMessage = "";
            let jsonObj;
            let logMessage = "";
            let fakeSession = null;

            // Mock the submit JCL function
            Search.dataSets = jest.fn(async (session) => {
                fakeSession = session;
                return {
                    success: true,
                    commandResponse: "Found \"test\" in 2 data sets and PDS members",
                    apiResponse: [
                        {
                            dsn: "TEST1.DS",
                            member: "TESTMEM",
                            matchList: [
                                {
                                    line: 1,
                                    column: 1,
                                    contents: "TEST CONTENTS"
                                }
                            ]
                        },
                        {
                            dsn: "TEST2.DS",
                            member: undefined,
                            matchList: [
                                {
                                    line: 1,
                                    column: 1,
                                    contents: "TEST CONTENTS"
                                }
                            ]
                        }
                    ]
                };
            });

            // Invoke the handler with a full set of mocked arguments and response functions
            await handler.process({
                arguments: {
                    $0: "fake",
                    _: ["fake"],
                    pattern,
                    searchString,
                    ...UNIT_TEST_ZOSMF_PROF_OPTS,
                    caseSensitive: true
                },
                response: {
                    data: {
                        setMessage: jest.fn((setMsgArgs) => {
                            apiMessage = setMsgArgs;
                        }),
                        setObj: jest.fn((setObjArgs) => {
                            jsonObj = setObjArgs;
                        })
                    },
                    console: {
                        log: jest.fn((logArgs) => {
                            logMessage += "\n" + logArgs;
                        })
                    },
                    progress: {
                        startBar: jest.fn((parms) => {
                            // do nothing
                        }),
                        endBar: jest.fn(() => {
                            // do nothing
                        })
                    }
                }
            } as any);

            expect(Search.dataSets).toHaveBeenCalledTimes(1);
            expect(Search.dataSets).toHaveBeenCalledWith(fakeSession, {
                pattern,
                searchString,
                caseSensitive: true,
                getOptions: {
                    encoding: undefined
                },
                mainframeSearch: undefined,
                maxConcurrentRequests: undefined,
                timeout: undefined,
                progressTask: {
                    percentComplete: 0,
                    statusMessage: "Starting search...",
                    stageName: TaskStage.NOT_STARTED
                }
            });
            expect(jsonObj).toMatchSnapshot();
            expect(apiMessage).toMatchSnapshot();
            expect(logMessage).toMatchSnapshot();
        });

        it("should search a data set if requested - with mainframe search", async () => {
            // Require the handler and create a new instance
            const handlerReq = require("../../../../../src/zosfiles/search/ds/DataSets.handler");
            const handler = new handlerReq.default();
            const pattern = "TEST*";
            const searchString = "test";

            // Vars populated by the mocked function
            let apiMessage = "";
            let jsonObj;
            let logMessage = "";
            let fakeSession = null;

            // Mock the submit JCL function
            Search.dataSets = jest.fn(async (session) => {
                fakeSession = session;
                return {
                    success: true,
                    commandResponse: "Found \"test\" in 2 data sets and PDS members",
                    apiResponse: [
                        {
                            dsn: "TEST1.DS",
                            member: "TESTMEM",
                            matchList: [
                                {
                                    line: 1,
                                    column: 1,
                                    contents: "TEST CONTENTS"
                                }
                            ]
                        },
                        {
                            dsn: "TEST2.DS",
                            member: undefined,
                            matchList: [
                                {
                                    line: 1,
                                    column: 1,
                                    contents: "TEST CONTENTS"
                                }
                            ]
                        }
                    ]
                };
            });

            // Invoke the handler with a full set of mocked arguments and response functions
            await handler.process({
                arguments: {
                    $0: "fake",
                    _: ["fake"],
                    pattern,
                    searchString,
                    ...UNIT_TEST_ZOSMF_PROF_OPTS,
                    mainframeSearch: true
                },
                response: {
                    data: {
                        setMessage: jest.fn((setMsgArgs) => {
                            apiMessage = setMsgArgs;
                        }),
                        setObj: jest.fn((setObjArgs) => {
                            jsonObj = setObjArgs;
                        })
                    },
                    console: {
                        log: jest.fn((logArgs) => {
                            logMessage += "\n" + logArgs;
                        })
                    },
                    progress: {
                        startBar: jest.fn((parms) => {
                            // do nothing
                        }),
                        endBar: jest.fn(() => {
                            // do nothing
                        })
                    }
                }
            } as any);

            expect(Search.dataSets).toHaveBeenCalledTimes(1);
            expect(Search.dataSets).toHaveBeenCalledWith(fakeSession, {
                pattern,
                searchString,
                caseSensitive: undefined,
                getOptions: {
                    encoding: undefined
                },
                mainframeSearch: true,
                maxConcurrentRequests: undefined,
                timeout: undefined,
                progressTask: {
                    percentComplete: 0,
                    statusMessage: "Starting search...",
                    stageName: TaskStage.NOT_STARTED
                }
            });
            expect(jsonObj).toMatchSnapshot();
            expect(apiMessage).toMatchSnapshot();
            expect(logMessage).toMatchSnapshot();
        });

        it("should search a data set if requested - with timeout", async () => {
            // Require the handler and create a new instance
            const handlerReq = require("../../../../../src/zosfiles/search/ds/DataSets.handler");
            const handler = new handlerReq.default();
            const pattern = "TEST*";
            const searchString = "test";

            // Vars populated by the mocked function
            let apiMessage = "";
            let jsonObj;
            let logMessage = "";
            let fakeSession = null;

            // Mock the submit JCL function
            Search.dataSets = jest.fn(async (session) => {
                fakeSession = session;
                return {
                    success: true,
                    commandResponse: "Found \"test\" in 2 data sets and PDS members",
                    apiResponse: [
                        {
                            dsn: "TEST1.DS",
                            member: "TESTMEM",
                            matchList: [
                                {
                                    line: 1,
                                    column: 1,
                                    contents: "TEST CONTENTS"
                                }
                            ]
                        },
                        {
                            dsn: "TEST2.DS",
                            member: undefined,
                            matchList: [
                                {
                                    line: 1,
                                    column: 1,
                                    contents: "TEST CONTENTS"
                                }
                            ]
                        }
                    ]
                };
            });

            // Invoke the handler with a full set of mocked arguments and response functions
            await handler.process({
                arguments: {
                    $0: "fake",
                    _: ["fake"],
                    pattern,
                    searchString,
                    ...UNIT_TEST_ZOSMF_PROF_OPTS,
                    timeout: 5
                },
                response: {
                    data: {
                        setMessage: jest.fn((setMsgArgs) => {
                            apiMessage = setMsgArgs;
                        }),
                        setObj: jest.fn((setObjArgs) => {
                            jsonObj = setObjArgs;
                        })
                    },
                    console: {
                        log: jest.fn((logArgs) => {
                            logMessage += "\n" + logArgs;
                        })
                    },
                    progress: {
                        startBar: jest.fn((parms) => {
                            // do nothing
                        }),
                        endBar: jest.fn(() => {
                            // do nothing
                        })
                    }
                }
            } as any);

            expect(Search.dataSets).toHaveBeenCalledTimes(1);
            expect(Search.dataSets).toHaveBeenCalledWith(fakeSession, {
                pattern,
                searchString,
                caseSensitive: undefined,
                getOptions: {
                    encoding: undefined
                },
                mainframeSearch: undefined,
                maxConcurrentRequests: undefined,
                timeout: 5,
                progressTask: {
                    percentComplete: 0,
                    statusMessage: "Starting search...",
                    stageName: TaskStage.NOT_STARTED
                }
            });
            expect(jsonObj).toMatchSnapshot();
            expect(apiMessage).toMatchSnapshot();
            expect(logMessage).toMatchSnapshot();
        });

        it("should search a data set if requested - with max concurrent requests", async () => {
            // Require the handler and create a new instance
            const handlerReq = require("../../../../../src/zosfiles/search/ds/DataSets.handler");
            const handler = new handlerReq.default();
            const pattern = "TEST*";
            const searchString = "test";

            // Vars populated by the mocked function
            let apiMessage = "";
            let jsonObj;
            let logMessage = "";
            let fakeSession = null;

            // Mock the submit JCL function
            Search.dataSets = jest.fn(async (session) => {
                fakeSession = session;
                return {
                    success: true,
                    commandResponse: "Found \"test\" in 2 data sets and PDS members",
                    apiResponse: [
                        {
                            dsn: "TEST1.DS",
                            member: "TESTMEM",
                            matchList: [
                                {
                                    line: 1,
                                    column: 1,
                                    contents: "TEST CONTENTS"
                                }
                            ]
                        },
                        {
                            dsn: "TEST2.DS",
                            member: undefined,
                            matchList: [
                                {
                                    line: 1,
                                    column: 1,
                                    contents: "TEST CONTENTS"
                                }
                            ]
                        }
                    ]
                };
            });

            // Invoke the handler with a full set of mocked arguments and response functions
            await handler.process({
                arguments: {
                    $0: "fake",
                    _: ["fake"],
                    pattern,
                    searchString,
                    ...UNIT_TEST_ZOSMF_PROF_OPTS,
                    maxConcurrentRequests: 5
                },
                response: {
                    data: {
                        setMessage: jest.fn((setMsgArgs) => {
                            apiMessage = setMsgArgs;
                        }),
                        setObj: jest.fn((setObjArgs) => {
                            jsonObj = setObjArgs;
                        })
                    },
                    console: {
                        log: jest.fn((logArgs) => {
                            logMessage += "\n" + logArgs;
                        })
                    },
                    progress: {
                        startBar: jest.fn((parms) => {
                            // do nothing
                        }),
                        endBar: jest.fn(() => {
                            // do nothing
                        })
                    }
                }
            } as any);

            expect(Search.dataSets).toHaveBeenCalledTimes(1);
            expect(Search.dataSets).toHaveBeenCalledWith(fakeSession, {
                pattern,
                searchString,
                caseSensitive: undefined,
                getOptions: {
                    encoding: undefined
                },
                mainframeSearch: undefined,
                maxConcurrentRequests: 5,
                timeout: undefined,
                progressTask: {
                    percentComplete: 0,
                    statusMessage: "Starting search...",
                    stageName: TaskStage.NOT_STARTED
                }
            });
            expect(jsonObj).toMatchSnapshot();
            expect(apiMessage).toMatchSnapshot();
            expect(logMessage).toMatchSnapshot();
        });

        it("should search a data set if requested - with encoding", async () => {
            // Require the handler and create a new instance
            const handlerReq = require("../../../../../src/zosfiles/search/ds/DataSets.handler");
            const handler = new handlerReq.default();
            const pattern = "TEST*";
            const searchString = "test";

            // Vars populated by the mocked function
            let apiMessage = "";
            let jsonObj;
            let logMessage = "";
            let fakeSession = null;

            // Mock the submit JCL function
            Search.dataSets = jest.fn(async (session) => {
                fakeSession = session;
                return {
                    success: true,
                    commandResponse: "Found \"test\" in 2 data sets and PDS members",
                    apiResponse: [
                        {
                            dsn: "TEST1.DS",
                            member: "TESTMEM",
                            matchList: [
                                {
                                    line: 1,
                                    column: 1,
                                    contents: "TEST CONTENTS"
                                }
                            ]
                        },
                        {
                            dsn: "TEST2.DS",
                            member: undefined,
                            matchList: [
                                {
                                    line: 1,
                                    column: 1,
                                    contents: "TEST CONTENTS"
                                }
                            ]
                        }
                    ]
                };
            });

            // Invoke the handler with a full set of mocked arguments and response functions
            await handler.process({
                arguments: {
                    $0: "fake",
                    _: ["fake"],
                    pattern,
                    searchString,
                    ...UNIT_TEST_ZOSMF_PROF_OPTS,
                    encoding: "IBM-037"
                },
                response: {
                    data: {
                        setMessage: jest.fn((setMsgArgs) => {
                            apiMessage = setMsgArgs;
                        }),
                        setObj: jest.fn((setObjArgs) => {
                            jsonObj = setObjArgs;
                        })
                    },
                    console: {
                        log: jest.fn((logArgs) => {
                            logMessage += "\n" + logArgs;
                        })
                    },
                    progress: {
                        startBar: jest.fn((parms) => {
                            // do nothing
                        }),
                        endBar: jest.fn(() => {
                            // do nothing
                        })
                    }
                }
            } as any);

            expect(Search.dataSets).toHaveBeenCalledTimes(1);
            expect(Search.dataSets).toHaveBeenCalledWith(fakeSession, {
                pattern,
                searchString,
                caseSensitive: undefined,
                getOptions: {
                    encoding: "IBM-037"
                },
                mainframeSearch: undefined,
                maxConcurrentRequests: undefined,
                timeout: undefined,
                progressTask: {
                    percentComplete: 0,
                    statusMessage: "Starting search...",
                    stageName: TaskStage.NOT_STARTED
                }
            });
            expect(jsonObj).toMatchSnapshot();
            expect(apiMessage).toMatchSnapshot();
            expect(logMessage).toMatchSnapshot();
        });
    });
});
