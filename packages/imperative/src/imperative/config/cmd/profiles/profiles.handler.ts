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

import { ICommandHandler, IHandlerParameters } from "../../../../cmd";
import { IConfigProfile } from "../../../../config";
import { ImperativeConfig } from "../../../../utilities";

/**
 * The get command group handler for cli configuration settings.
 */
export default class ProfilesHandler implements ICommandHandler {

    /**
     * Process the command and input.
     *
     * @param {IHandlerParameters} params Parameters supplied by yargs
     *
     * @throws {ImperativeError}
     */
    public async process(params: IHandlerParameters): Promise<void> {
        const config = ImperativeConfig.instance.config;
        const paths: string[] = [];
        this.build(config.properties.profiles, "", paths);
        params.response.data.setObj(paths);
        params.response.format.output({
            format: "list",
            output: paths
        });
    }

    private build(profiles: { [key: string]: IConfigProfile }, path: string, paths: string[]) {
        const tmp = path;
        for (const [n, p] of Object.entries(profiles)) {
            const cur = tmp + `${tmp.length > 0 ? "." : ""}${n}`;
            paths.push(cur);
            if (p.profiles != null)
                this.build(p.profiles, cur, paths);
        }
    }
}
