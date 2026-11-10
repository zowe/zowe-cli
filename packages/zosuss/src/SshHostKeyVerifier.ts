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

import { SshSession } from "./SshSession";
import { ISshHostKeyVerifierOptions } from "./doc/ISshHostKeyVerifierOptions";

/** Shared trust workflow for CLI, editor, and other SDK consumers. */
export class SshHostKeyVerifier {
    /**
     * Attach a runtime hook that rejects changed keys, confirms unknown keys, and pins accepted keys
     * in the session before attempting to save them. A save failure does not undo acceptance.
     * Shell performs pinned-key, known_hosts, and revocation checks before invoking this hook.
     * Prompts, diagnostics, and configuration storage are supplied by the application callbacks.
     * @param session SSH session to configure
     * @param options Application-specific confirmation, persistence, and reporting callbacks
     */
    public static attach(session: SshSession, options: ISshHostKeyVerifierOptions): void {
        if (session.ISshSession.insecure === true) {
            session.hostKeyVerifier = undefined;
            options.onInsecure?.();
            return;
        }

        session.hostKeyVerifier = async (info): Promise<boolean> => {
            if (info.changed) {
                await options.onChanged?.(info);
                return false;
            }
            if (await options.confirm(info) !== true) {
                return false;
            }

            session.ISshSession.hostKey = info.key;
            try {
                await options.save?.(info.key);
            } catch (error) {
                await options.onSaveError?.(error);
            }
            return true;
        };
    }
}
