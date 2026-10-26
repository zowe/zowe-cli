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

/** Information about a server key that requires a trust decision. */
export interface IHostKeyVerificationInfo {
    /** OpenSSH-style SHA256 fingerprint of the presented key. */
    fingerprint: string;
    /** Base64-encoded SSH public key blob. */
    key: string;
    /** Whether the key conflicts with an existing profile or known_hosts entry. */
    changed: boolean;
    /** Fingerprint of the conflicting trusted key, when available. */
    pinnedFingerprint?: string;
    /** True when the conflicting key came from ~/.ssh/known_hosts rather than the profile. */
    knownHosts?: boolean;
}

/** Application callbacks for the shared SSH trust-on-first-use workflow. */
export interface ISshHostKeyVerifierOptions {
    /** Ask whether to trust an unknown key. Noninteractive callers should return false. */
    confirm: (info: IHostKeyVerificationInfo) => Promise<boolean>;
    /** Report a changed key. Changed keys are rejected without calling confirm or save. */
    onChanged?: (info: IHostKeyVerificationInfo) => void | Promise<void>;
    /** Save an accepted key to application configuration. Never write to known_hosts. */
    save?: (key: string) => Promise<void>;
    /** Report a failed save; acceptance still applies to the current session. */
    onSaveError?: (error: Error) => void | Promise<void>;
    /** Warn when session.insecure explicitly disables host key verification. */
    onInsecure?: () => void;
}
