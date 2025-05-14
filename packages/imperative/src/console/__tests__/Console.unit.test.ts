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

import { Console, ConsoleLevels } from "../../console";
describe("Console tests", () => {
    // Update this if adding or renaming a console level!
    const CONSOLE_LEVELS: Exclude<ConsoleLevels, "off">[] = ["trace", "debug", "info", "warn", "error", "fatal"];

    it("Should allow for checking if a level is valid", () => {
        expect(Console.isValidLevel("trace")).toBeTruthy();
        expect(Console.isValidLevel("debug")).toBeTruthy();
        expect(Console.isValidLevel("info")).toBeTruthy();
        expect(Console.isValidLevel("warn")).toBeTruthy();
        expect(Console.isValidLevel("error")).toBeTruthy();
        expect(Console.isValidLevel("fatal")).toBeTruthy();

        expect(Console.isValidLevel("extreme")).toBeFalsy();
    });

    it("Should set a valid level and not set and invalid one", () => {
        const cons = new Console();
        const newLevel = "trace";
        expect(cons.level).toBe(Console.LEVEL_DEFAULT);

        cons.level = newLevel;
        expect(cons.level).toBe(newLevel);
    });

    it("Should throw error if setting invalid level", () => {
        expect(() => new Console().level = "crazy").toThrow("Invalid level specified");
    });

    it("Should allow turning off colors", () => {
        const cons = new Console();
        expect(cons.color).toBeTruthy();
        cons.color = false;
        expect(cons.color).toBeFalsy();
    });

    it("Should allow turning off prefix", () => {
        const cons = new Console();
        expect(cons.prefix).toBeTruthy();
        cons.prefix = false;
        expect(cons.prefix).toBeFalsy();
    });

    it("should reroute log calls to appropriate function for given level", () => {
        const cons = new Console();

        for (const level of CONSOLE_LEVELS) {
            const levelMock = jest.spyOn(cons, level).mockImplementation();
            cons.log(level, `${level} msg: %s`, "hello world");
            expect(levelMock).toHaveBeenCalledTimes(1);
            expect(levelMock).toHaveBeenCalledWith(`${level} msg: %s`, ["hello world"]);
        }
    });

    it("Should call stdout and stderr three times each", () => {
        const cons = new Console();

        cons.level = "trace";

        (cons as any).writeStdout = jest.fn();
        (cons as any).writeStderr = jest.fn();

        cons.trace("test");
        cons.debug("test");
        cons.info("test");
        cons.warn("test");
        cons.error("test");
        cons.fatal("test");

        const numberOfCalls = 3;

        expect((cons as any).writeStdout).toHaveBeenCalledTimes(numberOfCalls);
        expect((cons as any).writeStderr).toHaveBeenCalledTimes(numberOfCalls);
    });

    it("Should default to the same prefix as log4js", () => {
        jest.spyOn(Date.prototype, "getTimezoneOffset").mockReturnValueOnce(0);
        jest.spyOn(Date, "now").mockReturnValueOnce(45296789);
        expect(Console.buildPrefix("test")).toBe("[1970/01/01 12:34:56.789] [test] ");
    });
});
