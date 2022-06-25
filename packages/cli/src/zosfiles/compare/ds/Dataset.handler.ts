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

import { AbstractSession, IHandlerParameters, ITaskWithStatus, TaskStage, TextUtils, ImperativeConfig } from "@zowe/imperative";
import { Get, IZosFilesResponse } from "@zowe/zos-files-for-zowe-sdk";
import { ZosFilesBaseHandler } from "../../ZosFilesBase.handler";
import { diff } from "jest-diff";
import { ProcessUtils } from "@zowe/imperative";
import { createTwoFilesPatch } from "diff";
import { html } from "diff2html";
import * as path from 'path';
import * as fs from 'fs';
/**
 * Handler to view a data set's content
 * @export
 */
export default class DatasetHandler extends ZosFilesBaseHandler {
    public async processWithSession(commandParameters: IHandlerParameters, session: AbstractSession): Promise<IZosFilesResponse> {
        const task: ITaskWithStatus = {
            percentComplete: 0,
            statusMessage: "Retrieving first dataset",
            stageName: TaskStage.IN_PROGRESS
        };

        commandParameters.response.progress.startBar({ task });

        const dsContentBuf1 = await Get.dataSet(session, commandParameters.arguments.dataSetName1,
            {
                binary: commandParameters.arguments.binary,
                encoding: commandParameters.arguments.encoding,
                record: commandParameters.arguments.record,
                volume: commandParameters.arguments.volumeSerial,
                responseTimeout: commandParameters.arguments.responseTimeout,
                task: task
            }
        );
        commandParameters.response.progress.endBar();
        commandParameters.response.progress.startBar({ task });

        let binary2 = commandParameters.arguments.binary2;
        let encoding2 = commandParameters.arguments.encoding2;
        let record2 = commandParameters.arguments.record2;
        const browserView = commandParameters.arguments.browserview;
        const volumeSerial2 = commandParameters.arguments.volumeSerial2;

        if (binary2 == undefined) {
            binary2 = commandParameters.arguments.binary;
        }
        if (encoding2 == undefined) {
            encoding2 = commandParameters.arguments.encoding;
        }
        if (record2 == undefined) {
            record2 = commandParameters.arguments.record;
        }

        task.statusMessage = "Retrieving second dataset";
        const dsContentBuf2 = await Get.dataSet(session, commandParameters.arguments.dataSetName2,
            {
                binary: binary2,
                encoding: encoding2,
                record: record2,
                volume: volumeSerial2,
                responseTimeout: commandParameters.arguments.responseTimeout,
                task: task
            }
        );

        let dsContentString1 = "";
        let dsContentString2 = "";

        if (commandParameters.arguments.noseqnum) {
            const seqnumlen = 8;

            const dsStringArray1 = dsContentBuf1.toString().split("\n");
            for (const i in dsStringArray1) {
                const sl = dsStringArray1[i].length;
                const tempString = dsStringArray1[i].substring(0, sl - seqnumlen);
                dsContentString1 += tempString + "\n";
            }

            const dsStringArray2 = dsContentBuf2.toString().split("\n");
            for (const i in dsStringArray2) {
                const sl = dsStringArray2[i].length;
                const tempString = dsStringArray2[i].substring(0, sl - seqnumlen);
                dsContentString2 += tempString + "\n";
            }
        }
        else {
            dsContentString1 = dsContentBuf1.toString();
            dsContentString2 = dsContentBuf2.toString();
        }

        let jsonDiff = "";
        let expandflag = true;
        const contextLinesArg = commandParameters.arguments.contextlines;
        if (contextLinesArg >= 0) {
            expandflag = false;
        }

        jsonDiff = await diff(dsContentString1, dsContentString2, {
            aAnnotation: "Removed",
            bAnnotation: "Added",
            aColor: TextUtils.chalk.red,
            bColor: TextUtils.chalk.green,
            contextLines: contextLinesArg,
            expand: expandflag
        });


        //  CHECHKING IIF THE BROWSER VIEW IS TRUE, OPEN UP THE DIFFS IN BROWSER
        if (browserView) {
            const patchDiff = createTwoFilesPatch(
                commandParameters.arguments.dataSetName1, commandParameters.arguments.dataSetName2, dsContentString1, dsContentString2
            );

            const diffHtml = html(patchDiff, {
                // drawFileList: true,
                outputFormat: "side-by-side",
                matching: "lines",
                diffStyle: "char",
            });

            const diffLauncher = path.join(ImperativeConfig.instance.cliHome, './diff.html');
            if (diffHtml != null) {
                fs.writeFileSync(diffLauncher,
                    `<html>
                    <head>
                      <link
                        rel="stylesheet"
                        href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/10.7.1/styles/github.min.css"
                      />
                      <link
                        rel="stylesheet"
                        type="text/css"
                        href="https://cdn.jsdelivr.net/npm/diff2html/bundles/css/diff2html.min.css"
                      />
                      <script
                        type="text/javascript"
                        src="https://cdn.jsdelivr.net/npm/diff2html/bundles/js/diff2html-ui.min.js"
                      ></script>

                      <script>

                               const diffString = ${patchDiff}

                           document.addEventListener('DOMContentLoaded', function () {
                             var targetElement = document.getElementsByClassName('d2h-file-list-wrapper')[0];
                             var configuration = {
                               drawFileList: true,
                               fileListToggle: false,
                               fileListStartVisible: false,
                               fileContentToggle: false,
                               matching: 'lines',
                               outputFormat: 'side-by-side',
                               synchronisedScroll: true,
                               highlight: true,
                               renderNothingWhenEmpty: false,
                             };
                             var diff2htmlUi = new Diff2HtmlUI(targetElement, diffString, configuration);
                             diff2htmlUi.draw();
                             diff2htmlUi.highlightCode();
                           });
                      </script>

                      <meta content="0; url=diff.html?p=" />
                    </head>
                    <body>
                      ${diffHtml}
                    </body>
                  </html>
                  `);
            }
            ProcessUtils.openInDefaultApp(`file:///${diffLauncher}`);
            return {
                success: true,
                commandResponse: "Launching data-sets diffs in browser....",
                apiResponse: {}
            };
        }

        return {
            success: true,
            commandResponse: jsonDiff,
            apiResponse: {}
        };
    }
}
