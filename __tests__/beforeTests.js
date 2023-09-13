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

jest.setTimeout(200000);
const __mockedLogger = {debug: jest.fn(), info: jest.fn(), error: jest.fn(), trace: jest.fn(), fatal: jest.fn()};
const __imperativeLogger = {
  Logger: {
    getAppLogger: () => __mockedLogger,
    getImperativeLogger: () => __mockedLogger,
    getConsoleLogger: () => __mockedLogger,
    initLogger: jest.fn()
  },
  LoggerConfigBuilder: {
      getDefaultIConfigLogging: jest.fn(),
      getDefaultFileName: jest.fn(),
      addFileAppender: jest.fn()
  }
};
jest.mock("@zowe/imperative/lib/logger", () => __imperativeLogger);
