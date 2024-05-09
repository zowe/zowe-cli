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

import { ImperativeExpect } from "../../expect";
import { ImperativeError } from "../../error";
import { TestLogger } from "../../../__tests__/src/TestLogger";
// UnitTestUtils.replaceIt();

const obj = {
    data: "something",
    isReal: "yesIAm",
    blank: "",
};

const nestedObj = {
    data: "something",
    isReal: "yesIAm",
    blank: "",
    nest: {
        prop1: "hello",
        prop2: false,
        theZeroLengthArray: [] as any,
        containsArray: ["hello"]
    }
};

describe("ImperativeExpect tests", () => {
    describe("toMatchRegExp", () => {
        it("should not throw an error if the value matches the provided regular expression", () => {
            let error: ImperativeError = {} as any;
            try {
                ImperativeExpect.toMatchRegExp("token", "^token$");
            } catch(thrownError) {
                error = thrownError;
            }
            expect(error).toEqual({});
        });
        it("should throw an error if the value does not match the provided regular expression with custom message", () => {
            let error: ImperativeError = {} as any;
            try {
                ImperativeExpect.toMatchRegExp("token", "^token1", "test");
            } catch(thrownError) {
                error = thrownError;
            }
            expect(error.message).toContain("test");
        });
    });

    it("Should throw an error for an undefined key when we expect it to be defined", () => {
        let error: ImperativeError;
        try {
            ImperativeExpect.keysToBeDefined(obj, ["noExist"]);
        } catch (thrownError) {
            error = thrownError;
        }
        TestLogger.info(error.message);
        expect(error.message).toMatchSnapshot();
    });

    it("Should not throw an error for a list of defined keys", () => {
        let error: ImperativeError;
        try {
            ImperativeExpect.keysToBeDefined(obj, ["data", "isReal", "blank"]);
        } catch (thrownError) {
            error = thrownError;
        }
        expect(error).toBeUndefined();
    });

    it("Should throw an error for a defined key when the last one is undefined", () => {
        let error: ImperativeError;
        try {
            ImperativeExpect.keysToBeDefined(obj, ["data", "isReal", "notReal"]);
        } catch (thrownError) {
            error = thrownError;
        }
        TestLogger.info(error.message);
        expect(error.message).toMatchSnapshot();
    });

    it("Should not throw an error for a non-blank field", () => {
        let error: ImperativeError;
        try {
            ImperativeExpect.toBeDefinedAndNonBlank("hey", "not_blank");
        } catch (thrownError) {
            error = thrownError;
        }
        expect(error).toBeUndefined();
    });

    it("Should throw an error for a blank field", () => {
        let error: ImperativeError;
        try {
            ImperativeExpect.toBeDefinedAndNonBlank(" ", "blank");
        } catch (thrownError) {
            error = thrownError;
        }
        TestLogger.info(error.message);
        expect(error.message).toMatchSnapshot();
    });

    it("Should throw an error for a defined key that is blank", () => {
        let error: ImperativeError;
        try {
            ImperativeExpect.keysToBeDefinedAndNonBlank(obj, ["blank"]);
        } catch (thrownError) {
            error = thrownError;
        }
        TestLogger.info(error.message);
        expect(error.message).toMatchSnapshot();
    });

    it("Should not throw an error for a defined key that is blank", () => {
        let error: ImperativeError;
        try {
            ImperativeExpect.keysToBeDefined(obj, ["blank"]);
        } catch (thrownError) {
            error = thrownError;
        }
        expect(error).toBeUndefined();
    });

    it("Should not throw an error if the item is found in a list", () => {
        const exists = "exists";
        expect(ImperativeExpect.toBeOneOf(exists, [exists, "one", "two"])).toBe(exists);
        expect(ImperativeExpect.toBeOneOf(exists, ["one", "two", exists])).toBe(exists);
        expect(ImperativeExpect.toBeOneOf(exists, ["one", exists, "two"])).toBe(exists);
    });

    it("Should throw an error if an item is not found in a list", () => {
        let error: ImperativeError;
        try {
            ImperativeExpect.keysToBeUndefined(obj, ["noExist"]);
        } catch (thrownError) {
            error = thrownError;
        }
        expect(error).toBeUndefined();
    });

    it("Should not throw an error for an undefined key when we expect undefined", () => {
        let error: ImperativeError;
        try {
            ImperativeExpect.keysToBeUndefined(obj, ["noExist"]);
        } catch (thrownError) {
            error = thrownError;
        }
        expect(error).toBeUndefined();
    });

    it("Should throw an error for defined key that we want to be undefined", () => {
        let error: ImperativeError;
        try {
            ImperativeExpect.keysToBeUndefined(obj, ["data"]);
        } catch (thrownError) {
            error = thrownError;
        }
        TestLogger.info(error.message);
        expect(error.message).toMatchSnapshot();
    });

    it("Should throw an error for defined key that is last in a list of undefined keys", () => {
        let error: ImperativeError;
        try {
            ImperativeExpect.keysToBeUndefined(obj, ["fake1", "fake2", "data"]);
        } catch (thrownError) {
            error = thrownError;
        }
        TestLogger.info(error.message);
        expect(error.message).toMatchSnapshot();
    });

    it("should not throw error if the type is correct", () => {
        let error: ImperativeError;
        try {
            ImperativeExpect.keysToBeOfType(obj, "string", ["data"]);
        } catch (thrownError) {
            error = thrownError;
            expect(0).toBe(1);
        }
        expect(error).toBeUndefined();
    });

    it("should throw an error if the type is incorrect", () => {
        let error: ImperativeError;
        try {
            ImperativeExpect.keysToBeOfType(obj, "boolean", ["data"]);
        } catch (thrownError) {
            error = thrownError;
        }
        TestLogger.info(error.message);
        expect(error.message).toMatchSnapshot();
    });

    it("should not throw error if the type is correct of a nested property", () => {
        let error: ImperativeError;
        try {
            ImperativeExpect.keysToBeOfType(nestedObj, "boolean", ["nest.prop2"]);
        } catch (thrownError) {
            error = thrownError;
        }
        expect(error).toBeUndefined();
    });

    it("should throw error if the type is not correct of a nested property", () => {
        let error: ImperativeError;
        try {
            ImperativeExpect.keysToBeOfType(nestedObj, "string", ["nest.prop2"]);
        } catch (thrownError) {
            error = thrownError;
        }
        TestLogger.info(error.message);
        expect(error.message).toMatchSnapshot();
    });

    it("should throw error if the input is not an array and an array is expected", () => {
        let error: ImperativeError;
        try {
            ImperativeExpect.keysToBeAnArray(nestedObj, false, ["nest.prop2"]);
        } catch (thrownError) {
            error = thrownError;
        }
        TestLogger.info(error.message);
        expect(error.message).toMatchSnapshot();
    });

    it("should throw error if the input array is of length 0", () => {
        let error: ImperativeError;
        try {
            ImperativeExpect.keysToBeAnArray(nestedObj, true, ["nest.theZeroLengthArray"]);
        } catch (thrownError) {
            error = thrownError;
        }
        TestLogger.info(error.message);
        expect(error.message).toMatchSnapshot();
    });

    it("should not throw error if the input array is of length 0", () => {
        let error: ImperativeError;
        try {
            ImperativeExpect.keysToBeAnArray(nestedObj, false, ["nest.theZeroLengthArray"]);
        } catch (thrownError) {
            error = thrownError;
        }
        expect(error).toBeUndefined();
    });

    it("should not throw error if the entry is found", () => {
        let error: ImperativeError;
        try {
            ImperativeExpect.arrayToContain(nestedObj.nest.containsArray, (entry) => {
                return entry === "hello";
            });
        } catch (thrownError) {
            error = thrownError;
        }
        expect(error).toBeUndefined();
    });

    it("should throw an error if the entry is NOT found", () => {
        let error: ImperativeError;
        try {
            ImperativeExpect.arrayToContain(nestedObj.nest.containsArray, (entry) => {
                return entry === "test";
            });
        } catch (thrownError) {
            error = thrownError;
        }
        TestLogger.info(error.message);
        expect(error.message).toMatchSnapshot();
    });

    it("should allow an expect failure to be transformed", () => {
        let error: ImperativeError;
        try {
            ImperativeExpect.expectAndTransform(() => {
                ImperativeExpect.toBeEqual(0, 1);
            }, (impErr) => {
                return new ImperativeError({ msg: "The values weren't equal!!!" });
            });
        } catch (thrownError) {
            error = thrownError;
        }
        TestLogger.info(error.message);
        expect(error.message).toMatchSnapshot();
    });

    it("should allow a custom error message", () => {
        let error: ImperativeError;
        try {
            ImperativeExpect.toBeEqual(0, 1, "This is custom");
        } catch (thrownError) {
            error = thrownError;
        }
        TestLogger.info(error.message);
        expect(error.message).toMatchSnapshot();
    });

    it("should not throw error if the values are not equal", () => {
        let error: ImperativeError;
        try {
            ImperativeExpect.toNotBeEqual("this", "that");
        } catch (thrownError) {
            error = thrownError;
        }
        expect(error).toBeUndefined();
    });

    it("should throw an error if the values are equal and we're expected them to not be equal", () => {
        let error: ImperativeError;
        try {
            ImperativeExpect.toNotBeEqual("this", "this");
        } catch (thrownError) {
            error = thrownError;
        }
        TestLogger.info(error.message);
        expect(error).toMatchSnapshot();
    });
});
