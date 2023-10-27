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

import { ChainedHandlerService } from "../src/ChainedHandlerUtils";
import { IChainedHandlerEntry } from "../";
import { TestLogger } from "../../../__tests__/src/TestLogger";
import * as yargs from "yargs";

const testLogger = TestLogger.getTestLogger();
describe("Chained Handler Service", () => {
    const binName = "test";
    const dummyArgs: yargs.Arguments = {$0: "dummy", _: []};
    const THREE_AHEAD = 3;
    const normalConfig: IChainedHandlerEntry[] = [
        {
            handler: "dummy0",
            mapping: [
                {
                    value: "hard coded",
                    to: "current",
                    applyToHandlers: [0]
                },
                {
                    from: "test.path.here",
                    to: "myarg",
                    applyToHandlers: [THREE_AHEAD]
                },
                {
                    value: "myvalue",
                    to: "mysecondarg",
                    applyToHandlers: [THREE_AHEAD]
                }
            ]
        },
        {
            handler: "dummy1",
            mapping: [
                {
                    from: "my.other.path",
                    to: "otherarg",
                    applyToHandlers: [1, 2] // next handler and the one after that
                },
            ]
        },
        {
            handler: "dummy2",
            mapping: [{
                from: "hello.buddy",
                to: "tonext",
                // no applyToHandlers - should default to the next handler
            }, {
                from: "optional.path.here",
                optional: true,
                to: "optionalarg",
                applyToHandlers: [2]
            }]
        },
        {
            handler: "dummy3", // three ahead from earlier points here,
            // no mapping for this one
        },
        {
            handler: "dummy4", // optional.path.here will map here
        }];

    it("should reject a getArguments call if not enough response objects are provided", () => {
        const responses: any[] = [{hi: "hello"}, {hi: "hello"}];
        expect(() => {
            const tooFarIndex = 3;
            ChainedHandlerService.getArguments(binName,
                normalConfig,
                tooFarIndex,
                responses,
                dummyArgs,
                testLogger
            );
        }).toThrowErrorMatchingSnapshot();
    });

    it("should map a value from several past handlers properly", () => {
        const expected = "myexpectedvalue";
        const expected2 = "myOtherExpectedVALUE";
        const expected3 = "thisisthethirdtimeiamexpectingsomething";
        const responses: any[] = [
            {
                test: {
                    path:
                        {
                            here: expected
                        }
                }
            },
            {
                my: {
                    other: {
                        path: expected2
                    }
                }
            },
            {
                hello: {
                    buddy: expected3
                }
            }
        ];
        const correctIndex = 3;
        const args = ChainedHandlerService.getArguments(binName,
            normalConfig,
            correctIndex,
            responses,
            dummyArgs,
            testLogger
        );
        expect(args.myarg).toEqual(expected);
        expect(args.otherarg).toEqual(expected2);
        expect(args.tonext).toEqual(expected3);
        expect(args.mysecondarg).toEqual("myvalue");
    });

    it("should not fail if an optional mapping fails to load", () => {
        const correctIndex = 4;
        const responses: any[] = [{}, {}, {}, {}];
        let caughtError;

        try {
            const args = ChainedHandlerService.getArguments(binName,
                normalConfig,
                correctIndex,
                responses,
                dummyArgs,
                testLogger
            );
        } catch (error) {
            caughtError = error;
        }

        expect(caughtError).toBeUndefined();
    });

    it("should be able to set a hard-coded value for the current handler", () => {
        const correctIndex = 0;
        const responses: any[] = [];
        const config: IChainedHandlerEntry[] = [{
            handler: "dummy0",
            mapping: [
                {value: "test", to: "hardcode", applyToHandlers: [0]}
            ]
        }];
        const args = ChainedHandlerService.getArguments(binName,
            config,
            correctIndex,
            responses,
            dummyArgs,
            testLogger
        );
        expect(args.hardcode).toEqual("test");
    });

    it("should reject a mapping with a 'from' field for the current handler", () => {
        const correctIndex = 0;
        const responses: any[] = [];
        const config: IChainedHandlerEntry[] = [{
            handler: "dummy0",
            mapping: [
                {from: "test.should.not.work", to: "hardcode", applyToHandlers: [0]}
            ]
        }];
        try {
            const args = ChainedHandlerService.getArguments(binName,
                config,
                correctIndex,
                responses,
                dummyArgs,
                testLogger
            );
            expect(0).toEqual(1); // should have encountered an error
        } catch (e) {
            expect(JSON.stringify(e)).toContain("from");
        }
    });

    it("should fail when a non-optional 'from' mapping fails", () => {
        const correctIndex = 1;
        const responses: any[] = [{}];
        const config: IChainedHandlerEntry[] = [{
            handler: "dummy0",
            mapping: [
                {from: "test.should.not.work", to: "argument", applyToHandlers: [1]},
            ]
        },
        {
            handler: "dummy1",
            mapping: []
        }];
        try {
            const args = ChainedHandlerService.getArguments(binName,
                config,
                correctIndex,
                responses,
                dummyArgs,
                testLogger
            );
            expect(0).toEqual(1); // should have encountered an error
        } catch (e) {
            expect(JSON.stringify(e)).toContain("from");
            expect(JSON.stringify(e)).toContain("test.should.not.work");
        }
    });

    it("should be able to map from overall arguments", () => {
        const correctIndex = 0;
        const config: IChainedHandlerEntry[] = [
            {
                handler: "dummy0",
                mapping: [{
                    from: "myOverallArg",
                    to: "myhandlerarg",
                    mapFromArguments: true,
                    applyToHandlers: [0]
                }
                ]
            }
        ];
        const expected = "myvalueishere";
        const overallArgs = {$0: "dummy", _: [] as any, myOverallArg: expected};
        const responses: any[] = [];
        const args = ChainedHandlerService.getArguments(binName,
            config,
            correctIndex,
            responses,
            overallArgs,
            testLogger
        );
        expect(args.myhandlerarg).toEqual(expected);
    });

    it("should be able to map from overall arguments with array index syntax", () => {
        const correctIndex = 0;
        const config: IChainedHandlerEntry[] = [
            {
                handler: "dummy0",
                mapping: [{
                    from: "myOverallArg[2]",
                    to: "myhandlerarg",
                    mapFromArguments: true,
                    applyToHandlers: [0]
                }
                ]
            }
        ];
        const expected = "myvalueishere";
        const overallArgs = {$0: "dummy", _: [] as any, myOverallArg: ["hello", "hi", expected]};
        const responses: any[] = [];
        const args = ChainedHandlerService.getArguments(binName,
            config,
            correctIndex,
            responses,
            overallArgs,
            testLogger
        );
        expect(args.myhandlerarg).toEqual(expected);
    });

    it("should fail when a non-optional 'from' mapping fails if mapFromArguments is true", () => {
        const correctIndex = 1;
        const responses: any[] = [{}];
        const config: IChainedHandlerEntry[] = [{
            handler: "dummy0",
            mapping: [
                {from: "test.should.not.work", to: "argument", mapFromArguments: true, applyToHandlers: [1]},
            ]
        },
        {
            handler: "dummy1",
            mapping: []
        }];
        try {
            const args = ChainedHandlerService.getArguments(binName,
                config,
                correctIndex,
                responses,
                dummyArgs,
                testLogger
            );
            expect(0).toEqual(1); // should have encountered an error
        } catch (e) {
            expect(JSON.stringify(e)).toContain("from");
            expect(JSON.stringify(e)).toContain("argument");
            expect(JSON.stringify(e)).toContain("test.should.not.work");
        }
    });
});
