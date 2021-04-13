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

import { TextUtils } from "@zowe/imperative";
import { Constants } from "../../Constants";

// Todo: migrate strings into here for other JOBS commands
export default {
    CANCEL: {
    },
    DELETE: {
    },
    DOWNLOAD: {
    },
    LIST: {
    },
    SUBMIT: {
        SUMMARY: "Submit a z/OS job",
        DESCRIPTION: "Submit a job (JCL).",
        ACTIONS: {
            COMMON: {
                JCL_SYMBOLS_OPT:  "A string of JCL symbols to use for substitution. " +
                    "For symbol values with no spaces: \"symbol1=value1 symbol2=value2 ...\". " +
                    "When a value contains spaces, enclose the value in single quotes: " +
                    "\"symbol1='value 1 with spaces' symbol2='value 2 with spaces' ...\". " +
                    "To embed a single quote in a value, use two single quotes: \"NAME=O''Brian\"."
            },
            DATA_SET: {
                SUMMARY: "Submit a job contained in a data set",
                DESCRIPTION: "Submit a job (JCL) contained in a data set. The data set may be of type physical sequential or a " +
                    "PDS member. The command does not pre-validate the data set name. " +
                    "The command presents errors verbatim from the z/OSMF Jobs REST endpoints. " +
                    "For more information about z/OSMF Jobs API errors, see the z/OSMF Jobs API REST documentation.",
                POSITIONALS: {
                    DATASET: "The z/OS data set containing the JCL to submit. " +
                        "You can specify a physical sequential data set (for example, \"DATA.SET\") " +
                        "or a partitioned data set qualified by a member (for example, \"DATA.SET(MEMBER)\")."
                },
                OPTIONS: {
                    VOLUME: "The volume serial (VOLSER) where the data set resides. The option is required only when the data set is not" +
                        " catalogued on the system.",
                    WAIT_FOR_OUTPUT: "Wait for the job to enter OUTPUT status before completing the command.",
                    WAIT_FOR_ACTIVE: "Wait for the job to enter ACTIVE status before completing the command.",
                    VIEW_ALL_SPOOL_CONTENT: "Print all spool output." +
                        " If you use this option you will wait the job to complete.",
                    DIRECTORY: "The local directory you would like to download the output of the job." +
                        " Creates a subdirectory using the jobID as the name and files are titled based on DD names." +
                        " If you use this option you will wait the job to complete.",
                    EXTENSION: "A file extension to save the job output with. Default is '.txt'."
                },
                EXAMPLES: {
                    EX1: {
                        OPTIONS: "\"ibmuser.cntl(deploy)\"",
                        DESCRIPTION: "Submit the JCL in the data set \"ibmuser.cntl(deploy)\""
                    },
                    EX2: {
                        OPTIONS: "\"ibmuser.cntl(deploy)\" --vasc",
                        DESCRIPTION: "Submit the JCL in the data set \"ibmuser.cntl(deploy)\", wait for the job to " +
                        "complete and print all output from the job"
                    }
                }
            }
        }
    },
    VIEW: {
    }
};
