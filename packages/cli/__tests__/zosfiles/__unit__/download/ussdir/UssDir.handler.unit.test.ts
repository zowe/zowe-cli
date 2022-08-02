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

import { Download, IDownloadOptions, IUSSListOptions } from "@zowe/zos-files-for-zowe-sdk";
import { UNIT_TEST_ZOSMF_PROF_OPTS } from "../../../../../../../__tests__/__src__/mocks/ZosmfProfileMock";

const defaultListObj: IUSSListOptions = {
    name: "*",
    depth: undefined,
    filesys: undefined,
    group: undefined,
    maxLength: undefined,
    mtime: undefined,
    perm: undefined,
    size: undefined,
    symlinks: undefined,
    type: undefined,
    user: undefined
};
const defaultDownloadObj: IDownloadOptions = {
    task: {
        percentComplete: 0,
        stageName: 0,
        statusMessage: "Searching for files"
    }
};

describe("Download uss dir handler", () => {
    describe("process method", () => {
        it("should download a uss dir if requested", async () => {
            // Require the handler and create a new instance
            const handlerReq = require("../../../../../src/zosfiles/download/ussdir/UssDir.handler");
            const handler = new handlerReq.default();
            const ussDirName = "/z/testingDirectory";

            const localDownloadObj: IDownloadOptions = {...defaultDownloadObj};
            const localListObj: IUSSListOptions = {...defaultListObj};

            // Vars populated by the mocked function
            let error;
            let apiMessage = "";
            let jsonObj;
            let logMessage = "";
            let fakeSession = null;

            Download.ussDir = jest.fn((session) => {
                fakeSession = session;
                return {
                    success: true,
                    commandResponse: "downloaded"
                };
            });

            try {
                // Invoke the handler with a full set of mocked arguments and response functions
                await handler.process({
                    arguments: {
                        $0: "fake",
                        _: ["fake"],
                        ussDirName,
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
            } catch (e) {
                error = e;
            }

            expect(error).toBeUndefined();
            expect(Download.ussDir).toHaveBeenCalledTimes(1);
            expect(Download.ussDir).toHaveBeenCalledWith(fakeSession, ussDirName, localDownloadObj, localListObj);
            expect(jsonObj).toMatchSnapshot();
            expect(apiMessage).toMatchSnapshot();
            expect(logMessage).toMatchSnapshot();
        });

        it("should download a uss dir and look for a particular file", async () => {
            // Require the handler and create a new instance
            const handlerReq = require("../../../../../src/zosfiles/download/ussdir/UssDir.handler");
            const handler = new handlerReq.default();
            const ussDirName = "/z/testingDirectory";

            // Vars populated by the mocked function
            let error;
            let apiMessage = "";
            let jsonObj;
            let logMessage = "";
            let fakeSession = null;

            Download.ussDir = jest.fn((session) => {
                fakeSession = session;
                return {
                    success: true,
                    commandResponse: "downloaded"
                };
            });

            const localDownloadObj: IDownloadOptions = {...defaultDownloadObj};
            const localListObj: IUSSListOptions = {name: "fakefile.txt", ...defaultListObj};

            try {
                // Invoke the handler with a full set of mocked arguments and response functions
                await handler.process({
                    arguments: {
                        $0: "fake",
                        _: ["fake"],
                        ussDirName,
                        file: "fakefile.txt",
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
            } catch (e) {
                error = e;
            }

            expect(error).toBeUndefined();
            expect(Download.ussDir).toHaveBeenCalledTimes(1);
            expect(Download.ussDir).toHaveBeenCalledWith(fakeSession, ussDirName, localDownloadObj, localListObj);
            expect(jsonObj).toMatchSnapshot();
            expect(apiMessage).toMatchSnapshot();
            expect(logMessage).toMatchSnapshot();
        });

        it("should download a uss dir and look for a particular owner", async () => {
            // Require the handler and create a new instance
            const handlerReq = require("../../../../../src/zosfiles/download/ussdir/UssDir.handler");
            const handler = new handlerReq.default();
            const ussDirName = "/z/testingDirectory";

            // Vars populated by the mocked function
            let error;
            let apiMessage = "";
            let jsonObj;
            let logMessage = "";
            let fakeSession = null;

            Download.ussDir = jest.fn((session) => {
                fakeSession = session;
                return {
                    success: true,
                    commandResponse: "downloaded"
                };
            });

            const localDownloadObj: IDownloadOptions = {...defaultDownloadObj};
            const localListObj: IUSSListOptions = {...defaultListObj, user: "fakeuser"};

            try {
                // Invoke the handler with a full set of mocked arguments and response functions
                await handler.process({
                    arguments: {
                        $0: "fake",
                        _: ["fake"],
                        ussDirName,
                        owner: "fakeuser",
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
            } catch (e) {
                error = e;
            }

            expect(error).toBeUndefined();
            expect(Download.ussDir).toHaveBeenCalledTimes(1);
            expect(Download.ussDir).toHaveBeenCalledWith(fakeSession, ussDirName, localDownloadObj, localListObj);
            expect(jsonObj).toMatchSnapshot();
            expect(apiMessage).toMatchSnapshot();
            expect(logMessage).toMatchSnapshot();
        });

        it("should download a uss dir and look for a particular group", async () => {
            // Require the handler and create a new instance
            const handlerReq = require("../../../../../src/zosfiles/download/ussdir/UssDir.handler");
            const handler = new handlerReq.default();
            const ussDirName = "/z/testingDirectory";

            // Vars populated by the mocked function
            let error;
            let apiMessage = "";
            let jsonObj;
            let logMessage = "";
            let fakeSession = null;

            Download.ussDir = jest.fn((session) => {
                fakeSession = session;
                return {
                    success: true,
                    commandResponse: "downloaded"
                };
            });

            const localDownloadObj: IDownloadOptions = {...defaultDownloadObj};
            const localListObj: IUSSListOptions = {...defaultListObj, group: "fakegroup"};

            try {
                // Invoke the handler with a full set of mocked arguments and response functions
                await handler.process({
                    arguments: {
                        $0: "fake",
                        _: ["fake"],
                        ussDirName,
                        group: "fakegroup",
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
            } catch (e) {
                error = e;
            }

            expect(error).toBeUndefined();
            expect(Download.ussDir).toHaveBeenCalledTimes(1);
            expect(Download.ussDir).toHaveBeenCalledWith(fakeSession, ussDirName, localDownloadObj, localListObj);
            expect(jsonObj).toMatchSnapshot();
            expect(apiMessage).toMatchSnapshot();
            expect(logMessage).toMatchSnapshot();
        });

        it("should download a uss dir and look for a particular modification time", async () => {
            // Require the handler and create a new instance
            const handlerReq = require("../../../../../src/zosfiles/download/ussdir/UssDir.handler");
            const handler = new handlerReq.default();
            const ussDirName = "/z/testingDirectory";

            // Vars populated by the mocked function
            let error;
            let apiMessage = "";
            let jsonObj;
            let logMessage = "";
            let fakeSession = null;

            Download.ussDir = jest.fn((session) => {
                fakeSession = session;
                return {
                    success: true,
                    commandResponse: "downloaded"
                };
            });

            const localDownloadObj: IDownloadOptions = {...defaultDownloadObj};
            const localListObj: IUSSListOptions = {...defaultListObj, mtime: "10"};

            try {
                // Invoke the handler with a full set of mocked arguments and response functions
                await handler.process({
                    arguments: {
                        $0: "fake",
                        _: ["fake"],
                        ussDirName,
                        mtime: "10",
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
            } catch (e) {
                error = e;
            }

            expect(error).toBeUndefined();
            expect(Download.ussDir).toHaveBeenCalledTimes(1);
            expect(Download.ussDir).toHaveBeenCalledWith(fakeSession, ussDirName, localDownloadObj, localListObj);
            expect(jsonObj).toMatchSnapshot();
            expect(apiMessage).toMatchSnapshot();
            expect(logMessage).toMatchSnapshot();
        });

        it("should download a uss dir and look for a particular file size", async () => {
            // Require the handler and create a new instance
            const handlerReq = require("../../../../../src/zosfiles/download/ussdir/UssDir.handler");
            const handler = new handlerReq.default();
            const ussDirName = "/z/testingDirectory";

            // Vars populated by the mocked function
            let error;
            let apiMessage = "";
            let jsonObj;
            let logMessage = "";
            let fakeSession = null;

            Download.ussDir = jest.fn((session) => {
                fakeSession = session;
                return {
                    success: true,
                    commandResponse: "downloaded"
                };
            });

            const localDownloadObj: IDownloadOptions = {...defaultDownloadObj};
            const localListObj: IUSSListOptions = {...defaultListObj, size: "+512"};

            try {
                // Invoke the handler with a full set of mocked arguments and response functions
                await handler.process({
                    arguments: {
                        $0: "fake",
                        _: ["fake"],
                        ussDirName,
                        size: "+512",
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
            } catch (e) {
                error = e;
            }

            expect(error).toBeUndefined();
            expect(Download.ussDir).toHaveBeenCalledTimes(1);
            expect(Download.ussDir).toHaveBeenCalledWith(fakeSession, ussDirName, localDownloadObj, localListObj);
            expect(jsonObj).toMatchSnapshot();
            expect(apiMessage).toMatchSnapshot();
            expect(logMessage).toMatchSnapshot();
        });

        it("should download a uss dir and look for a particular file permission bitmask", async () => {
            // Require the handler and create a new instance
            const handlerReq = require("../../../../../src/zosfiles/download/ussdir/UssDir.handler");
            const handler = new handlerReq.default();
            const ussDirName = "/z/testingDirectory";

            // Vars populated by the mocked function
            let error;
            let apiMessage = "";
            let jsonObj;
            let logMessage = "";
            let fakeSession = null;

            Download.ussDir = jest.fn((session) => {
                fakeSession = session;
                return {
                    success: true,
                    commandResponse: "downloaded"
                };
            });

            const localDownloadObj: IDownloadOptions = {...defaultDownloadObj};
            const localListObj: IUSSListOptions = {...defaultListObj, perm: "755"};

            try {
                // Invoke the handler with a full set of mocked arguments and response functions
                await handler.process({
                    arguments: {
                        $0: "fake",
                        _: ["fake"],
                        ussDirName,
                        perm: "755",
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
            } catch (e) {
                error = e;
            }

            expect(error).toBeUndefined();
            expect(Download.ussDir).toHaveBeenCalledTimes(1);
            expect(Download.ussDir).toHaveBeenCalledWith(fakeSession, ussDirName, localDownloadObj, localListObj);
            expect(jsonObj).toMatchSnapshot();
            expect(apiMessage).toMatchSnapshot();
            expect(logMessage).toMatchSnapshot();
        });

        it("should download a uss dir and look for a particular file type", async () => {
            // Require the handler and create a new instance
            const handlerReq = require("../../../../../src/zosfiles/download/ussdir/UssDir.handler");
            const handler = new handlerReq.default();
            const ussDirName = "/z/testingDirectory";

            // Vars populated by the mocked function
            let error;
            let apiMessage = "";
            let jsonObj;
            let logMessage = "";
            let fakeSession = null;

            Download.ussDir = jest.fn((session) => {
                fakeSession = session;
                return {
                    success: true,
                    commandResponse: "downloaded"
                };
            });

            const localDownloadObj: IDownloadOptions = {...defaultDownloadObj};
            const localListObj: IUSSListOptions = {...defaultListObj, type: "f"};

            try {
                // Invoke the handler with a full set of mocked arguments and response functions
                await handler.process({
                    arguments: {
                        $0: "fake",
                        _: ["fake"],
                        ussDirName,
                        type: "f",
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
            } catch (e) {
                error = e;
            }

            expect(error).toBeUndefined();
            expect(Download.ussDir).toHaveBeenCalledTimes(1);
            expect(Download.ussDir).toHaveBeenCalledWith(fakeSession, ussDirName, localDownloadObj, localListObj);
            expect(jsonObj).toMatchSnapshot();
            expect(apiMessage).toMatchSnapshot();
            expect(logMessage).toMatchSnapshot();
        });

        it("should download a uss dir and use a specific folder depth", async () => {
            // Require the handler and create a new instance
            const handlerReq = require("../../../../../src/zosfiles/download/ussdir/UssDir.handler");
            const handler = new handlerReq.default();
            const ussDirName = "/z/testingDirectory";

            // Vars populated by the mocked function
            let error;
            let apiMessage = "";
            let jsonObj;
            let logMessage = "";
            let fakeSession = null;

            Download.ussDir = jest.fn((session) => {
                fakeSession = session;
                return {
                    success: true,
                    commandResponse: "downloaded"
                };
            });

            const localDownloadObj: IDownloadOptions = {...defaultDownloadObj};
            const localListObj: IUSSListOptions = {...defaultListObj, depth: 10};

            try {
                // Invoke the handler with a full set of mocked arguments and response functions
                await handler.process({
                    arguments: {
                        $0: "fake",
                        _: ["fake"],
                        ussDirName,
                        depth: 10,
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
            } catch (e) {
                error = e;
            }

            expect(error).toBeUndefined();
            expect(Download.ussDir).toHaveBeenCalledTimes(1);
            expect(Download.ussDir).toHaveBeenCalledWith(fakeSession, ussDirName, localDownloadObj, localListObj);
            expect(jsonObj).toMatchSnapshot();
            expect(apiMessage).toMatchSnapshot();
            expect(logMessage).toMatchSnapshot();
        });

        it("should download a uss dir and use a specific file system", async () => {
            // Require the handler and create a new instance
            const handlerReq = require("../../../../../src/zosfiles/download/ussdir/UssDir.handler");
            const handler = new handlerReq.default();
            const ussDirName = "/z/testingDirectory";

            // Vars populated by the mocked function
            let error;
            let apiMessage = "";
            let jsonObj;
            let logMessage = "";
            let fakeSession = null;

            Download.ussDir = jest.fn((session) => {
                fakeSession = session;
                return {
                    success: true,
                    commandResponse: "downloaded"
                };
            });

            const localDownloadObj: IDownloadOptions = {...defaultDownloadObj};
            const localListObj: IUSSListOptions = {...defaultListObj, filesys: true};

            try {
                // Invoke the handler with a full set of mocked arguments and response functions
                await handler.process({
                    arguments: {
                        $0: "fake",
                        _: ["fake"],
                        ussDirName,
                        filesys: true,
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
            } catch (e) {
                error = e;
            }

            expect(error).toBeUndefined();
            expect(Download.ussDir).toHaveBeenCalledTimes(1);
            expect(Download.ussDir).toHaveBeenCalledWith(fakeSession, ussDirName, localDownloadObj, localListObj);
            expect(jsonObj).toMatchSnapshot();
            expect(apiMessage).toMatchSnapshot();
            expect(logMessage).toMatchSnapshot();
        });

        it("should download a uss dir and follow symlinks", async () => {
            // Require the handler and create a new instance
            const handlerReq = require("../../../../../src/zosfiles/download/ussdir/UssDir.handler");
            const handler = new handlerReq.default();
            const ussDirName = "/z/testingDirectory";

            // Vars populated by the mocked function
            let error;
            let apiMessage = "";
            let jsonObj;
            let logMessage = "";
            let fakeSession = null;

            Download.ussDir = jest.fn((session) => {
                fakeSession = session;
                return {
                    success: true,
                    commandResponse: "downloaded"
                };
            });

            const localDownloadObj: IDownloadOptions = {...defaultDownloadObj};
            const localListObj: IUSSListOptions = {...defaultListObj, symlinks: true};

            try {
                // Invoke the handler with a full set of mocked arguments and response functions
                await handler.process({
                    arguments: {
                        $0: "fake",
                        _: ["fake"],
                        ussDirName,
                        symlinks: true,
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
            } catch (e) {
                error = e;
            }

            expect(error).toBeUndefined();
            expect(Download.ussDir).toHaveBeenCalledTimes(1);
            expect(Download.ussDir).toHaveBeenCalledWith(fakeSession, ussDirName, localDownloadObj, localListObj);
            expect(jsonObj).toMatchSnapshot();
            expect(apiMessage).toMatchSnapshot();
            expect(logMessage).toMatchSnapshot();
        });
    });
});
