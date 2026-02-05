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

import { DeferredPromise } from "./DeferredPromise";

/**
 * AsyncMutex extends the DeferredPromise to be more tailored for use as a mutex
 * by making the type "void". It also adds the option for a caller to utilize
 * the "using" keyword to automatically resolve the mutex when leaving the
 * current scope. The option to externally resolve the mutex outside of the
 * current scope remains through the use of the underlying DeferredPromise's
 * public resolve() function.
 */
export class AsyncMutex extends DeferredPromise<void> implements Disposable {
    constructor(private onDispose?: () => void) {
        super();
    }

    public [Symbol.dispose](): void {
        this.resolve();
        this.onDispose?.();
    }
}