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

import { ImperativeError } from "../src/ImperativeError";

describe("ImperativeError", () => {
    it("should deprecate suppressReport", () => {
        jest.spyOn(console, "warn").mockImplementation(() => { return; });

        /* eslint-disable no-console */
        new ImperativeError({msg: "test"}, {suppressReport: false });

        expect(console.warn).toHaveBeenCalledWith(expect.stringContaining("[DEPRECATED]"));

        (console.warn as any).mockRestore();

        jest.spyOn(console, "warn").mockImplementation(() => { return; });

        new ImperativeError({msg: "test"}, {suppressReport: true });

        expect(console.warn).toHaveBeenCalledWith(expect.stringContaining("[DEPRECATED]"));

        (console.warn as any).mockRestore();
    });

    it("should not throw any deprecation warnings", () => {
        jest.spyOn(console, "warn").mockImplementation(() => { return; });

        new ImperativeError({msg: "test"});

        new ImperativeError({msg: "test"}, {
            tag: "test"
        });

        expect(console.warn).not.toHaveBeenCalled();

        (console.warn as any).mockRestore();
        /* eslint-enable no-console */
    });
});
