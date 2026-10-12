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
 * A single config layer that was redacted, either exported to disk or
 * produced as an in-memory preview (e.g. for a dry run).
 */
export interface IConfigExportRedactedResult {
    /** Relative path identifying the source config layer, e.g. "myproj/zowe.config.json" */
    source: string;

    /** The redacted contents of the config layer */
    redactedConfig: Record<string, any>;

    /** Absolute path to the exported file, if the layer was written to disk */
    target?: string;
}
