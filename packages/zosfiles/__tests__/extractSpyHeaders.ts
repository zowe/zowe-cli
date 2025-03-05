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
 * Helper to extract the headers from the last call of a spy.
 * Assumes that headers are passed as the third argument, else flattens object and searches for headers.
 */
export const extractSpyHeaders = (spy: jest.SpyInstance): any[] => {
  if (spy.mock.calls.length === 0) {
    throw new Error("Spy has not been called.");
  }
  // If headers are at index 2, return them
  if (spy.mock.calls[spy.mock.calls.length - 1][2]){
    return spy.mock.calls[spy.mock.calls.length - 1][2];
  }
  // Otherwise, recursively search for headers
  const extractedHeaders = findReqHeaders(spy.mock.calls);

  if (!extractedHeaders) {
    throw new Error("No headers found in the spy call");
  }

  return extractedHeaders;
};

/**
 * Recursively searches for the `reqHeaders` property within an object and returns its value if found.
 * @param obj - The object to search within.
 * @returns An array of request headers if found, otherwise `null`.
 */
const findReqHeaders = (obj: any): any[] | null => {
  if (!obj || typeof obj !== "object") return null;

  if (obj.reqHeaders) {
      return obj.reqHeaders;
  }

  for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
          const result = findReqHeaders(obj[key]);
          if (result) return result;
      }
  }

  return null;
};