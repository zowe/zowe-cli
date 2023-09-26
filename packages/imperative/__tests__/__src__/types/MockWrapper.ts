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

/**
 * Wraps an object with each key being a jest.Mock object. Should be used for getting
 * easier types of jest mock objects in unit tests.
 */
export type MockWrapper<T> = {
    [M in keyof T]: jest.Mock<T[M]>
};

/**
 * This function takes an object passed into it and converts the type to a {@link MockWrapper}.
 *
 * @param mock The object consisting of jest mocks.
 *
 * @returns The same object but each key typed as a mock.
 *
 * @example <caption>Proper Usage</caption>
 *
 * // In your test, there should be some jest mocks
 * jest.mock("./path/goes/here/Module1");
 * jest.mock("./path/goes/here/Module2");
 *
 * import {Module1} from "./path/goes/here/Module1";
 * import {Module2} from "./path/goes/here/Module2";
 * import {Module3} from "./path/goes/here/Module3";
 *
 * const mockObject = getMockWrapper({
 *    module1Function1: Module1.function1,
 *    module1Function2: Module1.function2,
 *    module2: Module2
 * });
 *
 * // Typescript will now accept the following syntax.
 * mockObject.module2.mockImplementation(() => {
 *     console.log("Implementation can be mocked");
 * });
 * mockObject.module1Function1.mocks.clear();
 *
 * Module1.function2("hooray proper types");
 * expect(module1Function2.mocks.calls[0][0]).toBe("hooray proper types");
 */
export function getMockWrapper<T extends object>(mock: T): MockWrapper<T> {
    return mock as MockWrapper<T>;
}
