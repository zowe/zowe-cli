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

import { Duplex } from "node:stream";

export class BufferBuilder extends Duplex {
    private chunks: Uint8Array[];

    public constructor() {
        super();
        this.chunks = [];
    }

    public _write(chunk: any, _encoding: BufferEncoding, callback: (error?: Error) => void): void {
        this.chunks.push(chunk);
        callback();
    }

    public _read(_size: number): void {
        const concatBuf = Buffer.concat(this.chunks);
        this.push(concatBuf);
        this.push(null);
    }
}
