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

import { ITaskWithStatus, TaskStage } from "../../../operations";

jest.mock("chalk");
import { CommandResponse } from "../../src/response/CommandResponse";
import { ImperativeError } from "../../../error";
import { inspect } from "util";
import { TestLogger } from "../../../../__tests__/src/TestLogger";
import { IO } from "../../../io";
import { OUTPUT_FORMAT } from "../..";
import { CliUtils, IDaemonResponse } from "../../../utilities";

const beforeForceColor = process.env.FORCE_COLOR;

const EXAMPLE_LIST = [
    "banana",
    "strawberry",
    "apple"
];

const EXAMPLE_NESTED = {
    name: "nested banana",
    list: EXAMPLE_LIST
};

const EXAMPLE_NESTED_OBJ = {
    name: "nested banana",
    obj: {
        details: "more details"
    }
};

const EXAMPLE_CIRCULAR = {
    name: "bad apple",
    fields: "place here"
};

const EXAMPLE_ARRAY = [
    {
        name: "banana",
        details: "A fruit that grows in a bunch",
        colors: ["yellow", "green", "black"]
    },
    {
        name: "strawberry",
        details: "A fruit that grows on vines",
        colors: ["white", "red"]
    },
    {
        name: "apple",
        details: "A fruit that grows on trees",
        colors: ["red", "green"]
    }
];

const EXAMPLE_NESTED_MORE = {
    name: "banana",
    description: {
        full: "a fruit",
        summary: "fruit"
    },
    attributes: {
        color: "green",
        rare: true
    },
    more: EXAMPLE_ARRAY
};

const chalk = require("chalk");
chalk.yellow = jest.fn((str: string) => {
    return str;
});
chalk.red = jest.fn((str: string) => {
    return str;
});

// Persist the original definitions of process.write
const ORIGINAL_STDOUT_WRITE = process.stdout.write;
const ORIGINAL_STDERR_WRITE = process.stderr.write;

describe("Command Response", () => {

    beforeEach(() => {
        // disable coloring
        process.env.FORCE_COLOR = "0";
    });

    // Restore everything after each test
    afterEach(() => {
        process.stdout.write = ORIGINAL_STDOUT_WRITE;
        process.stderr.write = ORIGINAL_STDERR_WRITE;
        process.env.FORCE_COLOR = beforeForceColor;
    });

    const testFile = __dirname + "/../../../__tests__/__results__/jest/progress_bar.txt";
    let stream: NodeJS.WriteStream;
    beforeAll(() => {
        IO.createDirsSyncFromFilePath(testFile);
        stream = require("fs").createWriteStream(testFile);
    });
    afterAll(() => {
        if (stream != null) {
            stream.end();
        }
        require("rimraf").sync(testFile);
    });

    it("If we create a progress bar, an interval should be set to update the bar. " +
        "If we finish the bar, the interval should be stopped and no longer stored" +
        "in the command response. ", (done) => {  // eslint-disable-line jest/no-done-callback
        const response = new CommandResponse({ silent: false, responseFormat: "default" });
        const status: ITaskWithStatus = {
            statusMessage: "Making a bar",
            percentComplete: 10,
            stageName: TaskStage.IN_PROGRESS
        };
        response.progress.startBar(
            {
                task: status,
                stream
            });
        expect((response as any).mProgressBar).toBeDefined(); // access private fields
        expect((response.progress as any).mProgressBarInterval).toBeDefined();
        TestLogger.debug("Progress bar was created. Details:\n{{progressBar}}\nInterval identifier:\n{{interval}}",
            {
                progressBar: inspect((response as any).progressBar),
                interval: inspect((response.progress as any).mProgressBarInterval)
            });
        const oneSecond = 1;
        setTimeout(() => {
            // turn off the progress bar - t he details should be set
            response.progress.endBar();
            expect((response as any).mProgressBar).toBeUndefined();
            expect((response.progress as any).mProgressBarInterval).toBeUndefined();
            done();
        }, oneSecond);
    });

    it("should allow the progress bar to write directly to a socket stream", (done) => {  // eslint-disable-line jest/no-done-callback
        const response = new CommandResponse({ silent: false, responseFormat: "default", stream });
        const status: ITaskWithStatus = {
            statusMessage: "Making a bar",
            percentComplete: 10,
            stageName: TaskStage.IN_PROGRESS
        };
        response.progress.startBar(
            {
                task: status,
                stream
            });
        expect((response as any).mProgressBar).toBeDefined(); // access private fields
        expect((response.progress as any).mProgressBarInterval).toBeDefined();
        expect((response.progress as any).mIsDaemon).toBe(true);
        (response.progress as any).updateProgressBar();
        TestLogger.debug("Progress bar was created. Details:\n{{progressBar}}\nInterval identifier:\n{{interval}}",
            {
                progressBar: inspect((response as any).progressBar),
                interval: inspect((response.progress as any).mProgressBarInterval)
            });
        const oneSecond = 1;
        setTimeout(() => {
            // force updateProgressBar to trigger the `endBar` call
            (response.progress as any).mProgressTask.stageName = TaskStage.COMPLETE;
            (response.progress as any).updateProgressBar();
            expect((response as any).mProgressBar).toBeUndefined();
            expect((response.progress as any).mProgressBarInterval).toBeUndefined();
            done();
        }, oneSecond);
    });

    it("If we create a progress bar, then set the bar to be complete, " +
        "the progress bar should automatically end ", (done) => {  // eslint-disable-line jest/no-done-callback
        const response = new CommandResponse({ silent: false, responseFormat: "default" });
        const status: ITaskWithStatus = {
            statusMessage: "Making a bar",
            percentComplete: 10,
            stageName: TaskStage.IN_PROGRESS
        };
        response.progress.startBar(
            {
                task: status,
                stream
            });
        expect((response as any).mProgressBar).toBeDefined(); // access private fields
        expect((response.progress as any).mProgressBarInterval).toBeDefined();
        TestLogger.debug("Progress bar was created. Details:\n{{progressBar}}\nInterval identifier:\n{{interval}}",
            {
                progressBar: inspect((response as any).progressBar),
                interval: inspect((response.progress as any).mProgressBarInterval)
            });
        status.stageName = TaskStage.COMPLETE;
        // make sure the private method is called -- could  be skipped in this test
        // due to async scheduling
        (response.progress as any).updateProgressBar();
        const oneSecond = 1;
        setTimeout(() => {
            // the progress bar should already be turned off now
            expect((response as any).mProgressBar).toBeUndefined();
            expect((response.progress as any).mProgressBarInterval).toBeUndefined();
            done();
        }, oneSecond);
    });


    it("If our response object is in silent mode, which is caused for example by " +
        "the user specifying that they want a JSON response, a progress bar should" +
        " not be created", () => {
        const response = new CommandResponse({ silent: true, responseFormat: "json" });
        const status: ITaskWithStatus = {
            statusMessage: "No bar should be made",
            percentComplete: 10,
            stageName: TaskStage.IN_PROGRESS
        };

        response.progress.startBar(
            {
                task: status,
                stream
            });
        expect((response as any).progressBar).toBeUndefined();
        expect((response as any).progressBarInterval).toBeUndefined();
    });


    it("should not duplicate output when calling endBar", () => {
        let stdoutMsg: string = "";
        let stderrMsg: string = "";
        const response = new CommandResponse({responseFormat: "default"});
        process.stdout.write = jest.fn((data) => {
            stdoutMsg += data;
        });
        process.stderr.write = jest.fn((data) => {
            stderrMsg += data;
        });
        const task = {
            percentComplete: 0,
            statusMessage: "Test Task",
            stageName: TaskStage.IN_PROGRESS
        };
        const beforeMessage = "Message before progress bar";
        const duringMessage = "Message during progress bar";
        const afterMessage = "Message after progress bar";

        response.console.log(beforeMessage);
        response.console.error(beforeMessage);
        response.progress.startBar({task});
        response.console.log(duringMessage);
        response.console.error(duringMessage);
        response.progress.endBar();
        response.console.log(afterMessage);
        response.console.error(afterMessage);

        process.stdout.write = ORIGINAL_STDOUT_WRITE;
        process.stderr.write = ORIGINAL_STDERR_WRITE;

        expect(stdoutMsg).toMatchSnapshot();
        expect(stderrMsg).toMatch(new RegExp(`^Message before progress bar$\n^.*Message during progress bar$\n^Message after progress bar`, 'm'));
        expect(response.buildJsonResponse().stdout.toString()).toEqual(beforeMessage + "\n" + duringMessage + "\n" + afterMessage + "\n");
        expect(response.buildJsonResponse().stderr.toString()).toEqual(beforeMessage + "\n" + duringMessage + "\n" + afterMessage + "\n");
    });

    it("should allow us to create an instance", () => {
        let caughtError;
        try {
            const response = new CommandResponse();
        } catch (error) {
            caughtError = error;
        }
        expect(caughtError).toBeUndefined();
    });

    it("should detect invalid primary color", () => {
        let error;
        try {
            const response = new CommandResponse({ primaryTextColor: "" });
        } catch (e) {
            error = e;
        }
        expect(error).toBeDefined();
        expect(error instanceof ImperativeError).toBe(true);
        expect(error.message).toMatchSnapshot();
    });

    it("should detect invalid response format", () => {
        let error;
        try {
            const parms: any = { responseFormat: "crazy" };
            const response = new CommandResponse(parms);
        } catch (e) {
            error = e;
        }
        expect(error).toBeDefined();
        expect(error instanceof ImperativeError).toBe(true);
        expect(error.message).toMatchSnapshot();
    });

    it("should indicate the command succeeded by default", () => {
        const response = new CommandResponse();
        expect(response.buildJsonResponse()).toMatchSnapshot();
    });

    it("should indicate the response format default if nothing was specified", () => {
        const response = new CommandResponse();
        expect(response.responseFormat).toEqual("default");
    });

    it("should indicate the response format is JSON if specified", () => {
        const response = new CommandResponse({ responseFormat: "json" });
        expect(response.responseFormat).toEqual("json");
    });

    it("should indicate silent mode if specified", () => {
        const response = new CommandResponse({ silent: true });
        expect(response.silent).toEqual(true);
    });

    it("should indicate not silent mode by default", () => {
        const response = new CommandResponse();
        expect(response.silent).toEqual(false);
    });

    it("should allow us to set the primary highlight color", () => {
        const response = new CommandResponse({ primaryTextColor: "purple" });
        expect((response as any).mPrimaryTextColor).toEqual("purple");
    });

    it("should allow us to set the progress bar spinners", () => {
        const response = new CommandResponse({ progressBarSpinner: "o0o" });
        expect((response as any).mProgressBarSpinnerChars).toEqual("o0o");
    });

    it("should allow us to set an error", () => {
        const response = new CommandResponse();
        response.setError({
            msg: "error occurred",
            additionalDetails: "More details...",
            stack: "The stack",
            causeErrors: { this: "is ths cause" },
            errorCode: "0"
        });
        expect(response.buildJsonResponse()).toMatchSnapshot();
    });

    it("should allow us to indicate that the command failed", () => {
        const response = new CommandResponse();
        response.failed();
        expect(response.buildJsonResponse()).toMatchSnapshot();
    });

    it("should allow us to indicate that the command succeeded", () => {
        const response = new CommandResponse();
        response.failed();
        response.succeeded();
        expect(response.buildJsonResponse()).toMatchSnapshot();
    });

    it("should prompt for input when in daemon mode and give a parsed result", async () => {

        // this will be the response to the prompt
        const responseMessage = "daemon response";

        // construct the response in a proper protocol header (see DaemonUtils.ts)
        const daemonResponse: IDaemonResponse = { stdin: responseMessage };

        // simulate a .on(data...) method
        const eventStream = jest.fn((event: string, func: (data: any) => void) => {
            func(Buffer.from(JSON.stringify(daemonResponse)));
        });

        // ignore writestream, we just make sure that it's called, it will send a request to our
        // simulated daemon client asking for a response.
        const writeStream = jest.fn((data) => {
            // do nothing
        });

        const endStream = jest.fn(() => {
            // do nothing
        });

        // build our pseudo socket object
        const socket: any = {once: eventStream, write: writeStream, end: endStream};

        // create response object
        const response = new CommandResponse({stream: socket});

        // method to simulate writing
        const write = jest.fn((data) => {
            // do nothing
        });
        process.stdout.write = write;

        // prompt the daemon client
        const msg: string = "please give me a message";
        const answer = await response.console.prompt(msg);
        response.endStream(); // terminate

        // restore
        process.stdout.write = ORIGINAL_STDOUT_WRITE;

        expect(write).not.toHaveBeenCalled();
        expect(writeStream).toHaveBeenCalled();
        expect(endStream).toHaveBeenCalled();
        expect(answer).toBe(responseMessage);
    });

    it("should prompt when not in daemon mode and give a parsed result", async () => {

        // this will be the response to the prompt
        const responseMessage = "normal response";

        const response = new CommandResponse();

        // method to simulate writing
        const write = jest.fn((data) => {
            // do nothing
        });
        process.stdout.write = write;

        const normalPrompt = jest.fn((test, opts) => {
            return new Promise<string>((resolve) => {
                resolve(responseMessage);
            });
        });

        (CliUtils as any).readPrompt = normalPrompt;

        // prompt the user
        const msg: string = "please give me a message";
        const answer = await response.console.prompt(msg);

        // restore
        process.stdout.write = ORIGINAL_STDOUT_WRITE;

        expect(normalPrompt).toHaveBeenCalled();
    });

    it("should write to stdout (with newline) and buffer to the response object", () => {
        let messages: string = "";
        const response = new CommandResponse();
        process.stdout.write = jest.fn((data) => {
            messages += data;
        });
        const msg: string = "hello from the tests";
        response.console.log(msg);
        process.stdout.write = ORIGINAL_STDOUT_WRITE;
        expect(messages).toMatchSnapshot();
        expect(response.buildJsonResponse().stdout.toString()).toEqual(msg + "\n");
        expect(response.buildJsonResponse()).toMatchSnapshot();
    });

    it("should write to stdout stream", () => {
        let messages: string = "";
        const fakeStream = {
            write: jest.fn(),
            end: jest.fn()
        };
        const response = new CommandResponse({
            stream: fakeStream
        });
        process.stdout.write = jest.fn((data) => {
            messages += data;
        });
        const msg: string = "hello from the tests";
        response.console.log(msg);
        process.stdout.write = ORIGINAL_STDOUT_WRITE;
        expect(messages).toMatchSnapshot();
        expect(response.buildJsonResponse().stdout.toString()).toEqual(msg + "\n");
        expect(response.buildJsonResponse()).toMatchSnapshot();
    });

    it("should write to stderr and stream", () => {
        let messages: string = "";
        const fakeStream = {
            write: jest.fn(),
            end: jest.fn()
        };
        const response = new CommandResponse({
            stream: fakeStream
        });
        process.stderr.write = jest.fn((data) => {
            messages += data;
        });
        const msg: string = "hello from the tests";
        response.console.error(msg);
        process.stderr.write = ORIGINAL_STDERR_WRITE;
        expect(messages).toMatchSnapshot();
        expect(response.buildJsonResponse().stderr.toString()).toEqual(msg + "\n");
        expect(response.buildJsonResponse()).toMatchSnapshot();
    });


    it("should write to stderr (with newline) and buffer to the response object", () => {
        let messages: string = "";
        const response = new CommandResponse();
        process.stderr.write = jest.fn((data) => {
            messages += data;
        });
        const msg: string = "hello from the tests";
        response.console.error(msg);
        process.stderr.write = ORIGINAL_STDERR_WRITE;
        expect(messages).toMatchSnapshot();
        expect(response.buildJsonResponse().stderr.toString()).toEqual(msg + "\n");
        expect(response.buildJsonResponse()).toMatchSnapshot();
    });

    it("should write to both stdout and stderr and buffer to both respectively", () => {
        let stdoutMsg: string = "";
        let stderrMsg: string = "";
        const response = new CommandResponse();
        process.stdout.write = jest.fn((data) => {
            stdoutMsg += data;
        });
        process.stderr.write = jest.fn((data) => {
            stderrMsg += data;
        });
        const stdoutMessage: string = "hello from the tests - stdout";
        const stderrMessage: string = "hello from the tests - stderr";
        response.console.log(stdoutMessage);
        response.console.error(stderrMessage);
        process.stderr.write = ORIGINAL_STDERR_WRITE;
        process.stdout.write = ORIGINAL_STDOUT_WRITE;
        expect(stdoutMsg).toMatchSnapshot();
        expect(stderrMsg).toMatchSnapshot();
        expect(response.buildJsonResponse().stdout.toString()).toEqual(stdoutMessage + "\n");
        expect(response.buildJsonResponse().stderr.toString()).toEqual(stderrMessage + "\n");
        expect(response.buildJsonResponse()).toMatchSnapshot();
    });

    it("should write data to stdout (no newline) and buffer to the response object", () => {
        let messages: string = "";
        const response = new CommandResponse();
        process.stdout.write = jest.fn((data) => {
            messages += data;
        });
        const msg: string = "hello from the tests";
        response.console.log(Buffer.from(msg));
        process.stdout.write = ORIGINAL_STDOUT_WRITE;
        expect(messages).toMatchSnapshot();
        expect(response.buildJsonResponse().stdout.toString()).toEqual(msg);
        expect(response.buildJsonResponse()).toMatchSnapshot();
    });

    it("should write data to stderr (no newline) and buffer to the response object", () => {
        let messages: string = "";
        const response = new CommandResponse();
        process.stderr.write = jest.fn((data) => {
            messages += data;
        });
        const msg: string = "hello from the tests";
        response.console.error(Buffer.from(msg));
        process.stderr.write = ORIGINAL_STDERR_WRITE;
        expect(messages).toMatchSnapshot();
        expect(response.buildJsonResponse().stderr.toString()).toEqual(msg);
        expect(response.buildJsonResponse()).toMatchSnapshot();
    });

    it("should write error header messages to stderr and invoke chalk to colorize in red", () => {
        let messages: string = "";
        const response = new CommandResponse();
        process.stderr.write = jest.fn((data) => {
            messages += data;
        });
        chalk.red = jest.fn((message) => {
            return message;
        });
        const msg: string = "Error Header!";
        response.console.errorHeader(msg);
        process.stderr.write = ORIGINAL_STDERR_WRITE;
        expect(chalk.red).toHaveBeenCalledTimes(1);
        expect(messages).toMatchSnapshot();
        expect(response.buildJsonResponse().stderr.toString()).toEqual(msg + ":\n");
        expect(response.buildJsonResponse()).toMatchSnapshot();
    });

    it("should not write to stdout (but still buffer) if silent mode is enabled", () => {
        let messages: string = "";
        const response = new CommandResponse({ silent: true });
        process.stdout.write = jest.fn((data) => {
            messages += data;
        });
        const msg: string = "hello from the tests";
        response.console.log(msg);
        expect(process.stdout.write).toHaveBeenCalledTimes(0);
        process.stdout.write = ORIGINAL_STDOUT_WRITE;
        expect(messages).toEqual("");
        expect(response.buildJsonResponse().stdout.toString()).toEqual(msg + "\n");
        expect(response.buildJsonResponse()).toMatchSnapshot();
    });

    it("should not write to stderr (but still buffer) if silent mode is enabled", () => {
        let messages: string = "";
        const response = new CommandResponse({ silent: true });
        process.stderr.write = jest.fn((data) => {
            messages += data;
        });
        const msg: string = "hello from the tests";
        response.console.error(msg);
        expect(process.stderr.write).toHaveBeenCalledTimes(0);
        process.stderr.write = ORIGINAL_STDERR_WRITE;
        expect(messages).toEqual("");
        expect(response.buildJsonResponse().stderr.toString()).toEqual(msg + "\n");
        expect(response.buildJsonResponse()).toMatchSnapshot();
    });

    it("should not write an error header to stderr (but still buffer) if silent mode is enabled", () => {
        let messages: string = "";
        const response = new CommandResponse({ silent: true });
        process.stderr.write = jest.fn((data) => {
            messages += data;
        });
        chalk.red = jest.fn((message) => {
            return message;
        });
        const msg: string = "Error Header!";
        response.console.errorHeader(msg);
        expect(process.stderr.write).toHaveBeenCalledTimes(0);
        process.stderr.write = ORIGINAL_STDERR_WRITE;
        expect(chalk.red).toHaveBeenCalledTimes(1);
        expect(messages).toEqual("");
        expect(response.buildJsonResponse().stderr.toString()).toEqual(msg + ":\n");
        expect(response.buildJsonResponse()).toMatchSnapshot();
    });

    it("should not write to both stdout and stderr (but still buffer) if silent mode is enabled", () => {
        let stdoutMsg: string = "";
        let stderrMsg: string = "";
        const response = new CommandResponse({ silent: true });
        process.stdout.write = jest.fn((data) => {
            stdoutMsg += data;
        });
        process.stderr.write = jest.fn((data) => {
            stderrMsg += data;
        });
        const stdoutMessage: string = "hello from the tests - stdout";
        const stderrMessage: string = "hello from the tests - stderr";
        response.console.log(stdoutMessage);
        response.console.error(stderrMessage);
        expect(process.stderr.write).toHaveBeenCalledTimes(0);
        expect(process.stderr.write).toHaveBeenCalledTimes(0);
        process.stderr.write = ORIGINAL_STDERR_WRITE;
        process.stdout.write = ORIGINAL_STDOUT_WRITE;
        expect(stdoutMsg).toEqual("");
        expect(stderrMsg).toEqual("");
        expect(response.buildJsonResponse().stdout.toString()).toEqual(stdoutMessage + "\n");
        expect(response.buildJsonResponse().stderr.toString()).toEqual(stderrMessage + "\n");
        expect(response.buildJsonResponse()).toMatchSnapshot();
    });

    it("should format messages when using a format string to stdout", () => {
        let messages: string = "";
        const response = new CommandResponse();
        process.stdout.write = jest.fn((data) => {
            messages += data;
        });
        const format: string = "hello %s";
        const msg: string = "from the tests";
        response.console.log(format, msg);
        process.stdout.write = ORIGINAL_STDOUT_WRITE;
        expect(messages).toMatchSnapshot();
        expect(response.buildJsonResponse().stdout.toString()).toEqual("hello from the tests\n");
        expect(response.buildJsonResponse()).toMatchSnapshot();
    });

    it("should format messages when using a format string to stderr", () => {
        let messages: string = "";
        const response = new CommandResponse();
        process.stderr.write = jest.fn((data) => {
            messages += data;
        });
        const format: string = "hello %s";
        const msg: string = "from the tests";
        response.console.error(format, msg);
        process.stderr.write = ORIGINAL_STDERR_WRITE;
        expect(messages).toMatchSnapshot();
        expect(response.buildJsonResponse().stderr.toString()).toEqual("hello from the tests\n");
        expect(response.buildJsonResponse()).toMatchSnapshot();
    });

    it("should allow us to set a JSON message", () => {
        let messages: string = "";
        const response = new CommandResponse();
        process.stdout.write = jest.fn((data) => {
            messages += data;
        });
        const msg: string = "JSON object message";
        response.data.setMessage(msg);
        expect(process.stdout.write).toHaveBeenCalledTimes(0);
        process.stdout.write = ORIGINAL_STDOUT_WRITE;
        expect(response.buildJsonResponse().message).toEqual(msg);
        expect(response.buildJsonResponse()).toMatchSnapshot();
    });

    it("should allow us to set an exit code", () => {
        let messages: string = "";
        const response = new CommandResponse();
        process.stdout.write = jest.fn((data) => {
            messages += data;
        });
        const exitCode = 143;
        response.data.setExitCode(exitCode);
        expect(process.stdout.write).toHaveBeenCalledTimes(0);
        process.stdout.write = ORIGINAL_STDOUT_WRITE;
        expect(response.buildJsonResponse().exitCode).toEqual(exitCode);
    });

    it("should overwrite the message if set multiple times", () => {
        let messages: string = "";
        const response = new CommandResponse();
        process.stdout.write = jest.fn((data) => {
            messages += data;
        });
        const firstMsg: string = "The First Message";
        const msg: string = "JSON object message";
        response.data.setMessage(firstMsg);
        response.data.setMessage(msg);
        expect(process.stdout.write).toHaveBeenCalledTimes(0);
        process.stdout.write = ORIGINAL_STDOUT_WRITE;
        expect(response.buildJsonResponse().message).toEqual(msg);
        expect(response.buildJsonResponse()).toMatchSnapshot();
    });

    it("should allow us to set the data object in the response as a string", () => {
        let messages: string = "";
        const response = new CommandResponse();
        process.stdout.write = jest.fn((data) => {
            messages += data;
        });
        const testData: string = "test data";
        response.data.setObj(testData);
        expect(process.stdout.write).toHaveBeenCalledTimes(0);
        process.stdout.write = ORIGINAL_STDOUT_WRITE;
        expect(response.buildJsonResponse().data).toEqual(testData);
        expect(response.buildJsonResponse()).toMatchSnapshot();
    });

    it("should allow us to set the data object in the response as an object", () => {
        let messages: string = "";
        const response = new CommandResponse();
        process.stdout.write = jest.fn((data) => {
            messages += data;
        });
        const testData: any = { theData: "test data" };
        response.data.setObj(testData);
        expect(process.stdout.write).toHaveBeenCalledTimes(0);
        process.stdout.write = ORIGINAL_STDOUT_WRITE;
        expect(response.buildJsonResponse().data).toEqual(testData);
        expect(response.buildJsonResponse()).toMatchSnapshot();
    });

    it("should allow us to set the data object in the response as an array", () => {
        let messages: string = "";
        const response = new CommandResponse();
        process.stdout.write = jest.fn((data) => {
            messages += data;
        });
        const testData: any = [{ theData: "test data" }];
        response.data.setObj(testData);
        expect(process.stdout.write).toHaveBeenCalledTimes(0);
        process.stdout.write = ORIGINAL_STDOUT_WRITE;
        expect(response.buildJsonResponse().data).toEqual(testData);
        expect(response.buildJsonResponse()).toMatchSnapshot();
    });

    it("should allow us to merge the data object in the response as an array", () => {
        let messages: string = "";
        const response = new CommandResponse();
        process.stdout.write = jest.fn((stdoutData) => {
            messages += stdoutData;
        });
        const data: any = { theData: "test data" };
        const mergeData: any = { moreData: "more test data" };
        const merged: any = {
            theData: "test data",
            moreData: "more test data"
        };
        response.data.setObj(data);
        response.data.setObj(mergeData, true);
        expect(process.stdout.write).toHaveBeenCalledTimes(0);
        process.stdout.write = ORIGINAL_STDOUT_WRITE;
        expect(response.buildJsonResponse().data).toEqual(merged);
        expect(response.buildJsonResponse()).toMatchSnapshot();
    });

    it("should overwrite the first object if set obj is called again", () => {
        let messages: string = "";
        const response = new CommandResponse();
        process.stdout.write = jest.fn((data) => {
            messages += data;
        });
        const data1: any = { theData: "test data 1" };
        const data2: any = { theData: "test data 2" };
        response.data.setObj(data1);
        response.data.setObj(data2);
        expect(process.stdout.write).toHaveBeenCalledTimes(0);
        process.stdout.write = ORIGINAL_STDOUT_WRITE;
        expect(response.buildJsonResponse().data).toEqual(data2);
        expect(response.buildJsonResponse()).toMatchSnapshot();
    });

    it("should allow us to set the message and the data", () => {
        let messages: string = "";
        const response = new CommandResponse();
        process.stdout.write = jest.fn((data) => {
            messages += data;
        });
        const msg: string = "The JSON message";
        const testData: any = { theData: "test data" };
        response.data.setObj(testData);
        response.data.setMessage(msg);
        expect(process.stdout.write).toHaveBeenCalledTimes(0);
        process.stdout.write = ORIGINAL_STDOUT_WRITE;
        expect(response.buildJsonResponse().data).toEqual(testData);
        expect(response.buildJsonResponse().message).toEqual(msg);
        expect(response.buildJsonResponse()).toMatchSnapshot();
    });

    it("should allow us to create a full/complex response and build the response", () => {
        let stdoutMsg: string = "";
        let stderrMsg: string = "";
        const response = new CommandResponse();
        process.stdout.write = jest.fn((data) => {
            stdoutMsg += data;
        });
        process.stderr.write = jest.fn((stderrData) => {
            stderrMsg += stderrData;
        });
        const stdoutMessage: string = "hello from the tests - stdout";
        const stderrMessage: string = "hello from the tests - stderr";
        const stderrHeader: string = "ERROR";
        const msg: string = "The JSON message";
        const testData: any = { theData: "test data" };
        response.console.log(stdoutMessage);
        response.console.errorHeader(stderrHeader);
        response.console.error(stderrMessage);
        response.data.setObj(testData);
        response.data.setMessage(msg);
        response.setError({
            msg: "error occurred",
            additionalDetails: "More details...",
            stack: "The stack",
            causeErrors: { this: "is ths cause" },
            errorCode: "0"
        });
        response.failed();
        expect(process.stdout.write).toHaveBeenCalledTimes(1);
        expect(process.stderr.write).toHaveBeenCalledTimes(2);
        process.stderr.write = ORIGINAL_STDERR_WRITE;
        process.stdout.write = ORIGINAL_STDOUT_WRITE;
        expect(stdoutMsg).toMatchSnapshot();
        expect(stderrMsg).toMatchSnapshot();
        expect(response.buildJsonResponse().data).toEqual(testData);
        expect(response.buildJsonResponse().message).toEqual(msg);
        expect(response.buildJsonResponse()).toMatchSnapshot();
    });

    it("should allow us to create a full/complex response and write the response", () => {
        let stdoutMsg: string = "";
        let stderrMsg: string = "";
        const response = new CommandResponse({ responseFormat: "json" });
        process.stdout.write = jest.fn((stdoutData) => {
            stdoutMsg += stdoutData;
        });
        process.stderr.write = jest.fn((stderrData) => {
            stderrMsg += stderrData;
        });
        const stdoutMessage: string = "hello from the tests - stdout";
        const stderrMessage: string = "hello from the tests - stderr";
        const stderrHeader: string = "ERROR";
        const msg: string = "The JSON message";
        const data: any = { theData: "test data" };
        response.console.log(stdoutMessage);
        response.console.errorHeader(stderrHeader);
        response.console.error(stderrMessage);
        response.data.setObj(data);
        response.data.setMessage(msg);
        response.setError({
            msg: "error occurred",
            additionalDetails: "More details...",
            stack: "The stack",
            causeErrors: { this: "is ths cause" },
            errorCode: "0"
        });
        response.failed();
        response.writeJsonResponse();
        expect(process.stdout.write).toHaveBeenCalledTimes(1);
        expect(process.stderr.write).toHaveBeenCalledTimes(0);
        process.stderr.write = ORIGINAL_STDERR_WRITE;
        process.stdout.write = ORIGINAL_STDOUT_WRITE;
        expect(stdoutMsg).toMatchSnapshot();
        expect(stderrMsg).toMatchSnapshot();
        expect(response.buildJsonResponse().data).toEqual(data);
        expect(response.buildJsonResponse().message).toEqual(msg);
        expect(response.buildJsonResponse()).toMatchSnapshot();
    });

    it("should allow us to create a full/complex response should not write if silent mode is enabled", () => {
        let stdoutMsg: string = "";
        let stderrMsg: string = "";
        const response = new CommandResponse({ silent: true });
        process.stdout.write = jest.fn((stdoutData) => {
            stdoutMsg += stdoutData;
        });
        process.stderr.write = jest.fn((stderrData) => {
            stderrMsg += stderrData;
        });
        const stdoutMessage: string = "hello from the tests - stdout";
        const stderrMessage: string = "hello from the tests - stderr";
        const stderrHeader: string = "ERROR";
        const msg: string = "The JSON message";
        const data: any = { theData: "test data" };
        response.console.log(stdoutMessage);
        response.console.errorHeader(stderrHeader);
        response.console.error(stderrMessage);
        response.data.setObj(data);
        response.data.setMessage(msg);
        response.setError({
            msg: "error occurred",
            additionalDetails: "More details...",
            stack: "The stack",
            causeErrors: { this: "is ths cause" },
            errorCode: "0"
        });
        response.failed();
        response.writeJsonResponse();
        expect(process.stdout.write).toHaveBeenCalledTimes(0);
        expect(process.stderr.write).toHaveBeenCalledTimes(0);
        process.stderr.write = ORIGINAL_STDERR_WRITE;
        process.stdout.write = ORIGINAL_STDOUT_WRITE;
        expect(stdoutMsg).toMatchSnapshot();
        expect(stderrMsg).toMatchSnapshot();
        expect(response.buildJsonResponse().data).toEqual(data);
        expect(response.buildJsonResponse().message).toEqual(msg);
        expect(response.buildJsonResponse()).toMatchSnapshot();
    });

    describe("format APIs", () => {
        describe("error checking", () => {
            it("should detect missing parameters", () => {
                let messages: string = "";
                process.stderr.write = jest.fn((data) => {
                    messages += data;
                });
                const response = new CommandResponse();
                let error;
                try {
                    response.format.output(undefined);
                } catch (e) {
                    error = e;
                }
                process.stderr.write = ORIGINAL_STDERR_WRITE;
                expect(messages).toMatchSnapshot();
                expect(error).toBeDefined();
                expect(error instanceof ImperativeError).toBe(true);
                expect(error.message).toMatchSnapshot();
            });

            it("should detect missing output data", () => {
                let messages: string = "";
                process.stderr.write = jest.fn((data) => {
                    messages += data;
                });
                const response = new CommandResponse();
                let error;
                try {
                    response.format.output({ format: "table", output: undefined });
                } catch (e) {
                    error = e;
                }
                process.stderr.write = ORIGINAL_STDERR_WRITE;
                expect(messages).toMatchSnapshot();
                expect(error).toBeDefined();
                expect(error instanceof ImperativeError).toBe(true);
                expect(error.message).toMatchSnapshot();
            });

            it("should detect missing format", () => {
                let messages: string = "";
                process.stderr.write = jest.fn((data) => {
                    messages += data;
                });
                const response = new CommandResponse();
                let error;
                try {
                    response.format.output({ format: undefined, output: EXAMPLE_ARRAY });
                } catch (e) {
                    error = e;
                }
                process.stderr.write = ORIGINAL_STDERR_WRITE;
                expect(messages).toMatchSnapshot();
                expect(error).toBeDefined();
                expect(error instanceof ImperativeError).toBe(true);
                expect(error.message).toMatchSnapshot();
            });

            it("should not allow a string to be formatted as a table", () => {
                let messages: string = "";
                process.stderr.write = jest.fn((data) => {
                    messages += data;
                });
                const response = new CommandResponse();
                let error;
                try {
                    response.format.output({ format: "table", output: "this is not a table" });
                } catch (e) {
                    error = e;
                }
                process.stderr.write = ORIGINAL_STDERR_WRITE;
                expect(messages).toMatchSnapshot();
                expect(error).toBeDefined();
                expect(error instanceof ImperativeError).toBe(true);
                expect(error.message).toMatchSnapshot();
            });

            it("should not allow a string to be formatted as an object", () => {
                let messages: string = "";
                process.stderr.write = jest.fn((data) => {
                    messages += data;
                });
                const response = new CommandResponse();
                let error;
                try {
                    response.format.output({ format: "object", output: "this is not a table" });
                } catch (e) {
                    error = e;
                }
                process.stderr.write = ORIGINAL_STDERR_WRITE;
                expect(messages).toMatchSnapshot();
                expect(error).toBeDefined();
                expect(error instanceof ImperativeError).toBe(true);
                expect(error.message).toMatchSnapshot();
            });

            it("should not allow a string to be formatted as a list", () => {
                let messages: string = "";
                process.stderr.write = jest.fn((data) => {
                    messages += data;
                });
                const response = new CommandResponse();
                let error;
                try {
                    response.format.output({ format: "list", output: "this is not a list" });
                } catch (e) {
                    error = e;
                }
                process.stderr.write = ORIGINAL_STDERR_WRITE;
                expect(messages).toMatchSnapshot();
                expect(error).toBeDefined();
                expect(error instanceof ImperativeError).toBe(true);
                expect(error.message).toMatchSnapshot();
            });

            it("should not allow a boolean to be formatted as a table", () => {
                let messages: string = "";
                process.stderr.write = jest.fn((data) => {
                    messages += data;
                });
                const response = new CommandResponse();
                let error;
                try {
                    response.format.output({ format: "table", output: false });
                } catch (e) {
                    error = e;
                }
                process.stderr.write = ORIGINAL_STDERR_WRITE;
                expect(messages).toMatchSnapshot();
                expect(error).toBeDefined();
                expect(error instanceof ImperativeError).toBe(true);
                expect(error.message).toMatchSnapshot();
            });

            it("should not allow a boolean to be formatted as an object", () => {
                let messages: string = "";
                process.stderr.write = jest.fn((data) => {
                    messages += data;
                });
                const response = new CommandResponse();
                let error;
                try {
                    response.format.output({ format: "object", output: false });
                } catch (e) {
                    error = e;
                }
                process.stderr.write = ORIGINAL_STDERR_WRITE;
                expect(messages).toMatchSnapshot();
                expect(error).toBeDefined();
                expect(error instanceof ImperativeError).toBe(true);
                expect(error.message).toMatchSnapshot();
            });

            it("should not allow a boolean to be formatted as a list", () => {
                let messages: string = "";
                process.stderr.write = jest.fn((data) => {
                    messages += data;
                });
                const response = new CommandResponse();
                let error;
                try {
                    response.format.output({ format: "list", output: true });
                } catch (e) {
                    error = e;
                }
                process.stderr.write = ORIGINAL_STDERR_WRITE;
                expect(messages).toMatchSnapshot();
                expect(error).toBeDefined();
                expect(error instanceof ImperativeError).toBe(true);
                expect(error.message).toMatchSnapshot();
            });

            it("should not allow an object to be formatted as a list", () => {
                let messages: string = "";
                process.stderr.write = jest.fn((data) => {
                    messages += data;
                });
                const response = new CommandResponse();
                let error;
                try {
                    response.format.output({ format: "list", output: EXAMPLE_ARRAY[0] });
                } catch (e) {
                    error = e;
                }
                process.stderr.write = ORIGINAL_STDERR_WRITE;
                expect(messages).toMatchSnapshot();
                expect(error).toBeDefined();
                expect(error instanceof ImperativeError).toBe(true);
                expect(error.message).toMatchSnapshot();
            });

            it("should handle a circular reference and throw an error", () => {
                let messages: string = "";
                process.stderr.write = jest.fn((data) => {
                    messages += data;
                });
                const response = new CommandResponse();
                let error;
                try {
                    const copy = JSON.parse(JSON.stringify(EXAMPLE_CIRCULAR));
                    copy.fields = copy;
                    response.format.output({ format: "object", output: copy });
                } catch (e) {
                    error = e;
                }
                process.stderr.write = ORIGINAL_STDERR_WRITE;
                expect(messages).toContain("bad apple");
                expect(messages).toContain("Circular");
                expect(error).toBeDefined();
                expect(error instanceof ImperativeError).toBe(true);
                expect(error.message).toContain("Error copying input parameters. Details: Converting circular structure to JSON");
            });

            it("should handle an invalid format type and throw an error", () => {
                let messages: string = "";
                process.stderr.write = jest.fn((data) => {
                    messages += data;
                });
                const response = new CommandResponse();
                let error;
                try {
                    const copy = JSON.parse(JSON.stringify(EXAMPLE_CIRCULAR));
                    copy.fields = copy;
                    response.format.output({ format: "awesome" as OUTPUT_FORMAT, output: copy });
                } catch (e) {
                    error = e;
                }
                process.stderr.write = ORIGINAL_STDERR_WRITE;
                expect(messages).toMatchSnapshot();
                expect(error).toBeDefined();
                expect(error instanceof ImperativeError).toBe(true);
                expect(error.message).toMatchSnapshot();
            });

            it("should give the extraction field name if data extraction changed the type", () => {
                let messages: string = "";
                process.stderr.write = jest.fn((data) => {
                    messages += data;
                });
                const response = new CommandResponse();
                let error;
                try {
                    response.format.output({ format: "object", output: EXAMPLE_ARRAY[0], fields: ["name"] });
                } catch (e) {
                    error = e;
                }
                process.stderr.write = ORIGINAL_STDERR_WRITE;
                expect(messages).toMatchSnapshot();
                expect(error).toBeDefined();
                expect(error instanceof ImperativeError).toBe(true);
                expect(error.message).toMatchSnapshot();
            });
        });

        describe("formatting", () => {

            it("should allow extraction of multiple nested properties and keep the property structure", () => {
                let messages: string = "";
                process.stdout.write = jest.fn((data) => {
                    messages += data;
                });
                const response = new CommandResponse();
                response.format.output({
                    format: "object",
                    output: EXAMPLE_NESTED_MORE,
                    fields: ["description.full",
                        "description.summary",
                        "attributes.color",
                        "attributes.rare"]
                });
                expect(process.stdout.write).toHaveBeenCalledTimes(1);
                process.stdout.write = ORIGINAL_STDOUT_WRITE;
                expect(messages).toMatchSnapshot();
            });

            it("should allow extraction of multiple nested properties and consolidate for a table", () => {
                let messages: string = "";
                process.stdout.write = jest.fn((data) => {
                    messages += data;
                });
                const response = new CommandResponse();
                response.format.output({
                    format: "table",
                    header: true,
                    output: EXAMPLE_NESTED_MORE,
                    fields: ["description.full",
                        "description.summary",
                        "attributes.color",
                        "attributes.rare"]
                });
                expect(process.stdout.write).toHaveBeenCalledTimes(1);
                process.stdout.write = ORIGINAL_STDOUT_WRITE;
                expect(messages).toMatchSnapshot();
            });

            it("should not attempt filtering on a string", () => {
                let messages: string = "";
                process.stdout.write = jest.fn((data) => {
                    messages += data;
                });
                const response = new CommandResponse();
                response.format.output({ format: "string", output: "this is a string", fields: ["wow"] });
                expect(process.stdout.write).toHaveBeenCalledTimes(1);
                process.stdout.write = ORIGINAL_STDOUT_WRITE;
                expect(messages).toMatchSnapshot();
            });

            it("should not attempt filtering on a boolean", () => {
                let messages: string = "";
                process.stdout.write = jest.fn((data) => {
                    messages += data;
                });
                const response = new CommandResponse();
                response.format.output({ format: "string", output: true, fields: ["wow"] });
                expect(process.stdout.write).toHaveBeenCalledTimes(1);
                process.stdout.write = ORIGINAL_STDOUT_WRITE;
                expect(messages).toMatchSnapshot();
            });

            it("should accept an array of JSON objects and format a table", () => {
                let messages: string = "";
                const response = new CommandResponse();
                process.stdout.write = jest.fn((data) => {
                    messages += data;
                });
                response.format.output({
                    format: "table",
                    output: EXAMPLE_ARRAY
                });
                expect(process.stdout.write).toHaveBeenCalledTimes(1);
                process.stdout.write = ORIGINAL_STDOUT_WRITE;
                expect(messages).toMatchSnapshot();
            });

            it("should accept an array of JSON objects and format a table with a single column", () => {
                let messages: string = "";
                const response = new CommandResponse();
                process.stdout.write = jest.fn((data) => {
                    messages += data;
                });
                response.format.output({
                    format: "table",
                    output: EXAMPLE_ARRAY,
                    fields: ["name"],
                    header: true
                });
                expect(process.stdout.write).toHaveBeenCalledTimes(1);
                process.stdout.write = ORIGINAL_STDOUT_WRITE;
                expect(messages).toMatchSnapshot();
            });

            it("should accept an array of JSON objects and format a stringified list", () => {
                let messages: string = "";
                const response = new CommandResponse();
                process.stdout.write = jest.fn((data) => {
                    messages += data;
                });
                response.format.output({
                    format: "list",
                    output: EXAMPLE_ARRAY
                });
                expect(process.stdout.write).toHaveBeenCalledTimes(1);
                process.stdout.write = ORIGINAL_STDOUT_WRITE;
                expect(messages).toMatchSnapshot();
            });

            it("should accept an array of JSON objects and format a string", () => {
                let messages: string = "";
                const response = new CommandResponse();
                process.stdout.write = jest.fn((data) => {
                    messages += data;
                });
                response.format.output({
                    format: "string",
                    output: EXAMPLE_ARRAY
                });
                expect(process.stdout.write).toHaveBeenCalledTimes(1);
                process.stdout.write = ORIGINAL_STDOUT_WRITE;
                expect(messages).toMatchSnapshot();
            });

            it("should accept an array of JSON objects and format a list of prettified objects", () => {
                let messages: string = "";
                const response = new CommandResponse();
                process.stdout.write = jest.fn((data) => {
                    messages += data;
                });
                response.format.output({
                    format: "object",
                    output: EXAMPLE_ARRAY
                });
                expect(process.stdout.write).toHaveBeenCalledTimes(1);
                process.stdout.write = ORIGINAL_STDOUT_WRITE;
                expect(messages).toMatchSnapshot();
            });

            it("should accept an array of JSON objects and format a table with a header", () => {
                let messages: string = "";
                const response = new CommandResponse();
                process.stdout.write = jest.fn((data) => {
                    messages += data;
                });
                response.format.output({
                    header: true,
                    format: "table",
                    output: EXAMPLE_ARRAY
                });
                expect(process.stdout.write).toHaveBeenCalledTimes(1);
                process.stdout.write = ORIGINAL_STDOUT_WRITE;
                expect(messages).toMatchSnapshot();
            });

            it("should accept a JSON object and format a table with a header", () => {
                let messages: string = "";
                const response = new CommandResponse();
                process.stdout.write = jest.fn((data) => {
                    messages += data;
                });
                response.format.output({
                    header: true,
                    format: "table",
                    output: EXAMPLE_ARRAY[0]
                });
                expect(process.stdout.write).toHaveBeenCalledTimes(1);
                process.stdout.write = ORIGINAL_STDOUT_WRITE;
                expect(messages).toMatchSnapshot();
            });

            it("should accept a JSON object and format a table", () => {
                let messages: string = "";
                const response = new CommandResponse();
                process.stdout.write = jest.fn((data) => {
                    messages += data;
                });
                response.format.output({
                    format: "table",
                    output: EXAMPLE_ARRAY[0]
                });
                expect(process.stdout.write).toHaveBeenCalledTimes(1);
                process.stdout.write = ORIGINAL_STDOUT_WRITE;
                expect(messages).toMatchSnapshot();
            });

            it("should accept a JSON object and prettify", () => {
                let messages: string = "";
                const response = new CommandResponse();
                process.stdout.write = jest.fn((data) => {
                    messages += data;
                });
                response.format.output({
                    format: "object",
                    output: EXAMPLE_ARRAY[0]
                });
                expect(process.stdout.write).toHaveBeenCalledTimes(1);
                process.stdout.write = ORIGINAL_STDOUT_WRITE;
                expect(messages).toMatchSnapshot();
            });

            it("should accept a JSON object and stringify", () => {
                let messages: string = "";
                const response = new CommandResponse();
                process.stdout.write = jest.fn((data) => {
                    messages += data;
                });
                response.format.output({
                    format: "string",
                    output: EXAMPLE_ARRAY[0]
                });
                expect(process.stdout.write).toHaveBeenCalledTimes(1);
                process.stdout.write = ORIGINAL_STDOUT_WRITE;
                expect(messages).toMatchSnapshot();
            });

            it("should accept an array of strings and stringify", () => {
                let messages: string = "";
                const response = new CommandResponse();
                process.stdout.write = jest.fn((data) => {
                    messages += data;
                });
                response.format.output({
                    format: "string",
                    output: EXAMPLE_LIST
                });
                expect(process.stdout.write).toHaveBeenCalledTimes(1);
                process.stdout.write = ORIGINAL_STDOUT_WRITE;
                expect(messages).toMatchSnapshot();
            });

            it("should accept an array of strings and format a list", () => {
                let messages: string = "";
                const response = new CommandResponse();
                process.stdout.write = jest.fn((data) => {
                    messages += data;
                });
                response.format.output({
                    format: "list",
                    output: EXAMPLE_LIST
                });
                expect(process.stdout.write).toHaveBeenCalledTimes(1);
                process.stdout.write = ORIGINAL_STDOUT_WRITE;
                expect(messages).toMatchSnapshot();
            });

            it("should accept a string and format a string", () => {
                let messages: string = "";
                const response = new CommandResponse();
                process.stdout.write = jest.fn((data) => {
                    messages += data;
                });
                response.format.output({
                    format: "string",
                    output: "this is a string"
                });
                expect(process.stdout.write).toHaveBeenCalledTimes(1);
                process.stdout.write = ORIGINAL_STDOUT_WRITE;
                expect(messages).toMatchSnapshot();
            });

            it("should accept a boolean and format a string", () => {
                let messages: string = "";
                const response = new CommandResponse();
                process.stdout.write = jest.fn((data) => {
                    messages += data;
                });
                response.format.output({
                    format: "string",
                    output: true
                });
                expect(process.stdout.write).toHaveBeenCalledTimes(1);
                process.stdout.write = ORIGINAL_STDOUT_WRITE;
                expect(messages).toMatchSnapshot();
            });

            it("should accept a number and format a string", () => {
                let messages: string = "";
                const response = new CommandResponse();
                process.stdout.write = jest.fn((data) => {
                    messages += data;
                });
                response.format.output({
                    format: "string",
                    output: 1000
                });
                expect(process.stdout.write).toHaveBeenCalledTimes(1);
                process.stdout.write = ORIGINAL_STDOUT_WRITE;
                expect(messages).toMatchSnapshot();
            });

            it("should accept an array of booleans and format a list", () => {
                let messages: string = "";
                const response = new CommandResponse();
                process.stdout.write = jest.fn((data) => {
                    messages += data;
                });
                response.format.output({
                    format: "list",
                    output: [true, false, true]
                });
                expect(process.stdout.write).toHaveBeenCalledTimes(1);
                process.stdout.write = ORIGINAL_STDOUT_WRITE;
                expect(messages).toMatchSnapshot();
            });

            it("should accept an array of numbers and format a list", () => {
                let messages: string = "";
                const response = new CommandResponse();
                process.stdout.write = jest.fn((data) => {
                    messages += data;
                });
                response.format.output({
                    format: "list",
                    output: [0, 1, 2]
                });
                expect(process.stdout.write).toHaveBeenCalledTimes(1);
                process.stdout.write = ORIGINAL_STDOUT_WRITE;
                expect(messages).toMatchSnapshot();
            });

            it("should accept an array of numbers and format a string", () => {
                let messages: string = "";
                const response = new CommandResponse();
                process.stdout.write = jest.fn((data) => {
                    messages += data;
                });
                response.format.output({
                    format: "string",
                    output: [0, 1, 2]
                });
                expect(process.stdout.write).toHaveBeenCalledTimes(1);
                process.stdout.write = ORIGINAL_STDOUT_WRITE;
                expect(messages).toMatchSnapshot();
            });

            it("should accept an array of objects and allow filtering for string output", () => {
                let messages: string = "";
                const response = new CommandResponse();
                process.stdout.write = jest.fn((data) => {
                    messages += data;
                });
                response.format.output({
                    format: "string",
                    output: EXAMPLE_ARRAY,
                    fields: ["name", "details"]
                });
                expect(process.stdout.write).toHaveBeenCalledTimes(1);
                process.stdout.write = ORIGINAL_STDOUT_WRITE;
                expect(messages).not.toContain("colors");
                expect(messages).toMatchSnapshot();
            });

            it("should accept an array of objects and allow filtering for list output", () => {
                let messages: string = "";
                const response = new CommandResponse();
                process.stdout.write = jest.fn((data) => {
                    messages += data;
                });
                response.format.output({
                    format: "list",
                    output: EXAMPLE_ARRAY,
                    fields: ["name", "details"]
                });
                expect(process.stdout.write).toHaveBeenCalledTimes(1);
                process.stdout.write = ORIGINAL_STDOUT_WRITE;
                expect(messages).not.toContain("colors");
                expect(messages).toMatchSnapshot();
            });

            it("should accept an array of objects and allow filtering for object output", () => {
                let messages: string = "";
                const response = new CommandResponse();
                process.stdout.write = jest.fn((data) => {
                    messages += data;
                });
                response.format.output({
                    format: "list",
                    output: EXAMPLE_ARRAY,
                    fields: ["name", "details"]
                });
                expect(process.stdout.write).toHaveBeenCalledTimes(1);
                process.stdout.write = ORIGINAL_STDOUT_WRITE;
                expect(messages).not.toContain("colors");
                expect(messages).toMatchSnapshot();
            });

            it("should accept an array of objects and allow filtering for table output", () => {
                let messages: string = "";
                const response = new CommandResponse();
                process.stdout.write = jest.fn((data) => {
                    messages += data;
                });
                response.format.output({
                    header: true,
                    format: "table",
                    output: EXAMPLE_ARRAY,
                    fields: ["name", "details"]
                });
                expect(process.stdout.write).toHaveBeenCalledTimes(1);
                process.stdout.write = ORIGINAL_STDOUT_WRITE;
                expect(messages).not.toContain("colors");
                expect(messages).toMatchSnapshot();
            });

            it("should accept a JSON object and allow filtering to a single property", () => {
                let messages: string = "";
                const response = new CommandResponse();
                process.stdout.write = jest.fn((data) => {
                    messages += data;
                });
                response.format.output({
                    header: true,
                    format: "string",
                    output: EXAMPLE_ARRAY[0],
                    fields: ["name"]
                });
                expect(process.stdout.write).toHaveBeenCalledTimes(1);
                process.stdout.write = ORIGINAL_STDOUT_WRITE;
                expect(messages).toMatchSnapshot();
            });

            it("should accept a JSON object and allow filtering", () => {
                let messages: string = "";
                const response = new CommandResponse();
                process.stdout.write = jest.fn((data) => {
                    messages += data;
                });
                response.format.output({
                    header: true,
                    format: "object",
                    output: EXAMPLE_ARRAY[0],
                    fields: ["name", "details"]
                });
                expect(process.stdout.write).toHaveBeenCalledTimes(1);
                process.stdout.write = ORIGINAL_STDOUT_WRITE;
                expect(messages).toMatchSnapshot();
            });

            it("should accept an array of JSON object and allow filtering to a single field and format a string", () => {
                let messages: string = "";
                const response = new CommandResponse();
                process.stdout.write = jest.fn((data) => {
                    messages += data;
                });
                response.format.output({
                    header: true,
                    format: "string",
                    output: EXAMPLE_ARRAY,
                    fields: ["name"]
                });
                expect(process.stdout.write).toHaveBeenCalledTimes(1);
                process.stdout.write = ORIGINAL_STDOUT_WRITE;
                expect(messages).toMatchSnapshot();
            });

            it("should accept an array of JSON object and allow filtering to a single field and format an object", () => {
                let messages: string = "";
                const response = new CommandResponse();
                process.stdout.write = jest.fn((data) => {
                    messages += data;
                });
                response.format.output({
                    header: true,
                    format: "string",
                    output: EXAMPLE_ARRAY,
                    fields: ["name"]
                });
                expect(process.stdout.write).toHaveBeenCalledTimes(1);
                process.stdout.write = ORIGINAL_STDOUT_WRITE;
                expect(messages).toMatchSnapshot();
            });

            it("should accept an array of booleans and a filter and format a string of an array of nulls", () => {
                let messages: string = "";
                const response = new CommandResponse();
                process.stdout.write = jest.fn((data) => {
                    messages += data;
                });
                response.format.output({
                    header: true,
                    format: "string",
                    output: [true, false, true],
                    fields: ["name"]
                });
                expect(process.stdout.write).toHaveBeenCalledTimes(1);
                process.stdout.write = ORIGINAL_STDOUT_WRITE;
                expect(messages).toMatchSnapshot();
            });

            it("should accept a JSON object, filter to a single field (which is an array), and change to output a list", () => {
                let messages: string = "";
                const response = new CommandResponse();
                process.stdout.write = jest.fn((data) => {
                    messages += data;
                });
                response.format.output({
                    header: true,
                    format: "list",
                    output: EXAMPLE_NESTED,
                    fields: ["list"]
                });
                expect(process.stdout.write).toHaveBeenCalledTimes(1);
                process.stdout.write = ORIGINAL_STDOUT_WRITE;
                expect(messages).toMatchSnapshot();
            });

            it("should accept a JSON object, filter to a single field (which is an object), and change to output an object", () => {
                let messages: string = "";
                const response = new CommandResponse();
                process.stdout.write = jest.fn((data) => {
                    messages += data;
                });
                response.format.output({
                    header: true,
                    format: "object",
                    output: EXAMPLE_NESTED_OBJ,
                    fields: ["obj"]
                });
                expect(process.stdout.write).toHaveBeenCalledTimes(1);
                process.stdout.write = ORIGINAL_STDOUT_WRITE;
                expect(messages).toMatchSnapshot();
            });

            it("should accept an array of JSON objects and allow filtering to a single property list", () => {
                let messages: string = "";
                const response = new CommandResponse();
                process.stdout.write = jest.fn((data) => {
                    messages += data;
                });
                response.format.output({
                    header: true,
                    format: "list",
                    output: EXAMPLE_ARRAY,
                    fields: ["name"]
                });
                expect(process.stdout.write).toHaveBeenCalledTimes(1);
                process.stdout.write = ORIGINAL_STDOUT_WRITE;
                expect(messages).toMatchSnapshot();
            });

            it("should allow options to override the default for header", () => {
                let messages: string = "";
                const response = new CommandResponse({
                    definition: {
                        name: "fake",
                        description: "fake",
                        type: "command",
                        outputFormatOptions: true
                    },
                    args: {
                        $0: undefined,
                        _: undefined,
                        responseFormatHeader: true
                    }
                });
                process.stdout.write = jest.fn((data) => {
                    messages += data;
                });
                response.format.output({
                    header: false,
                    format: "table",
                    output: EXAMPLE_ARRAY
                });
                expect(process.stdout.write).toHaveBeenCalledTimes(1);
                process.stdout.write = ORIGINAL_STDOUT_WRITE;
                expect(messages).toMatchSnapshot();
            });

            it("should allow options to override the default for filter", () => {
                let messages: string = "";
                const response = new CommandResponse({
                    definition: {
                        name: "fake",
                        description: "fake",
                        type: "command",
                        outputFormatOptions: true
                    },
                    args: {
                        $0: undefined,
                        _: undefined,
                        responseFormatFilter: ["name", "details", "colors"]
                    }
                });
                process.stdout.write = jest.fn((data) => {
                    messages += data;
                });
                response.format.output({
                    header: true,
                    format: "table",
                    output: EXAMPLE_ARRAY,
                    fields: ["name", "details"]
                });
                expect(process.stdout.write).toHaveBeenCalledTimes(1);
                process.stdout.write = ORIGINAL_STDOUT_WRITE;
                expect(messages).toMatchSnapshot();
            });

            it("should allow options to override the default for format type", () => {
                let messages: string = "";
                const response = new CommandResponse({
                    definition: {
                        name: "fake",
                        description: "fake",
                        type: "command",
                        outputFormatOptions: true
                    },
                    args: {
                        $0: undefined,
                        _: undefined,
                        responseFormatType: "object"
                    }
                });
                process.stdout.write = jest.fn((data) => {
                    messages += data;
                });
                response.format.output({
                    header: false,
                    format: "table",
                    output: EXAMPLE_ARRAY
                });
                expect(process.stdout.write).toHaveBeenCalledTimes(1);
                process.stdout.write = ORIGINAL_STDOUT_WRITE;
                expect(messages).toMatchSnapshot();
            });
        });
    });
});
