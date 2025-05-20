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

import { TextUtils } from "npm:@zowe/imperative";
import { Constants } from "../../Constants";

export default {
    COMMON: {
        ATTRIBUTE_TITLE: "The following attributes are used during creation:\n",
        FOR: "for",
        TO: "to",
        WITH_VALUE: "with value"
    },
    CREATE: {
        SUMMARY: "Create data sets",
        DESCRIPTION: "Create data sets.",
        ACTIONS: {
            DATA_SET_BINARY: {
                SUMMARY: "Create executable data sets",
                DESCRIPTION: "Create executable data sets.",
                EXAMPLES: {
                    EX1: "Create an empty binary partitioned data set (PDS) with default parameters",
                    EX2: "Create an empty binary PDSE using data set type LIBRARY"
                }
            },
            DATA_SET_CLASSIC: {
                SUMMARY: "Create classic data sets (JCL, HLASM, CBL, etc...)",
                DESCRIPTION: "Create classic data sets (JCL, HLASM, CBL, etc...).",
                EXAMPLES: {
                    EX1: "Create an empty z/OS 'classic' PDS with default parameters",
                    EX2: `Create an empty z/OS 'classic' PDSE using data set type LIBRARY`
                }
            },
            DATA_SET_C: {
                SUMMARY: "Create data sets for C code programming",
                DESCRIPTION: "Create data sets for C code programming.",
                EXAMPLES: {
                    EX1: "Create an empty C code PDS with default parameters",
                    EX2: "Create an empty C code PDSE using data set type LIBRARY"
                }
            },
            DATA_SET_LIKE: {
                SUMMARY: "Create data sets based on the properties of an existing data set",
                DESCRIPTION: "Create data sets based on the properties of an existing data set.",
                EXAMPLES: {
                    EX1: "Create a data set with default parameters and like flag",
                    EX2: "Create a data set with default parameters and like flag and lrecl flag",
                    EX3: "Create a data set with type LIBRARY"
                }
            },
            DATA_SET_PARTITIONED: {
                SUMMARY: "Create partitioned data sets (PDS)",
                DESCRIPTION: "Create partitioned data sets (PDS).",
                EXAMPLES: {
                    EX1: "Create an empty PDS with default parameters",
                    EX2: "Create an empty PDSE using data set type LIBRARY"
                }
            },
            DATA_SET_SEQUENTIAL: {
                SUMMARY: "Create physical sequential data sets (PS)",
                DESCRIPTION: "Create physical sequential data sets (PS).",
                EXAMPLES: {
                    EX1: "Create an empty physical sequential data set with default parameters",
                    EX2: "Create a LARGE format sequential data set with default parameters"
                }
            },
            VSAM: {
                SUMMARY: "Create a VSAM cluster",
                DESCRIPTION: "Create a VSAM cluster.",
                POSITIONALS: {
                    DATASETNAME: "The name of the data set in which to create a VSAM cluster"
                },
                OPTIONS: {
                    RETAINFOR: "The number of days that the VSAM cluster will be retained on the system. You can delete the cluster at any " +
                        "time when neither retain-for nor retain-to is specified.",
                    RETAINTO: "The earliest date that a command without the PURGE parameter can delete an entry. Specify the expiration " +
                        "date in the form yyyyddd, where yyyy is a four-digit year" +
                        " (maximum value: 2155) and ddd is the three-digit day of the year " +
                        "from 001 through 365 (for non-leap years) or 366 (for leap years). You can delete the cluster at any time when neither " +
                        "retain-for nor retain-to is used. You cannot specify both the 'retain-to' and 'retain-for' options.",
                    SECONDARY: "The number of items for the secondary space allocation (for example, 840). " +
                        "The type of item allocated is the same as the type used for the '--size' option. " +
                        "If you do not specify a secondary allocation, a value of ~10% of the primary allocation is used.",
                    SIZE: "The primary size to allocate for the VSAM cluster. Specify size as the number of items to allocate (nItems). " +
                        "You specify the type of item by keyword.",
                    VOLUMES: "The storage volumes on which to allocate a VSAM cluster. Specify a single volume by its volume serial (VOLSER). To " +
                        "specify more than one volume, enclose the option in double-quotes and separate each VOLSER with a space. " +
                        "You must specify the volumes option when your cluster is not SMS-managed."
                },
                EXAMPLES: {
                    DEFAULT_VALUES: `Create a VSAM data set named "SOME.DATA.SET.NAME" using default values of INDEXED, 840 KB primary storage and ` +
                        `84 KB secondary storage`,
                    SHOW_FIVE_MB: `Create a 5 MB LINEAR VSAM data set named "SOME.DATA.SET.NAME" with 1 MB of secondary space. Show the properties ` +
                        `of the data set when it is created`,
                    RETAIN_100_DAYS: `Create a VSAM data set named "SOME.DATA.SET.NAME", which is retained for 100 days`
                }
            },
            ZFS: {
                SUMMARY: "Create a z/OS file system",
                DESCRIPTION: "Create a z/OS file system.",
                POSITIONALS: {
                    FILESYSTEMNAME: "The name of the file system to create."
                },
                OPTIONS: {
                    OWNER: "The z/OS user ID or UID for the owner of the ZFS root directory.",
                    GROUP: "The z/OS group ID or GID for the group of the ZFS root directory.",
                    PERMS: "The permissions code for the ZFS root directory.",
                    CYLS_PRI: "The number of primary cylinders to allocate for the ZFS.",
                    CYLS_SEC: "The number of secondary cylinders to allocate for the ZFS.",
                    VOLUMES: "The storage volumes on which to allocate the z/OS file system. Specify a single volume by its volume serial " +
                        "(VOLSER). To specify more than one volume, separate each VOLSER with a space. You must specify the volumes option " +
                        "when your cluster is not SMS-managed.",
                    TIMEOUT: `The number of seconds to wait for the underlying "zfsadm format" command to complete. If this command times out, ` +
                        `the ZFS may have been created but not formatted correctly.`
                },
                EXAMPLES: {
                    DEFAULT_VALUES: `Create a ZFS named "HLQ.MYNEW.ZFS" using default values of 755 permissions, 10 primary and 2 secondary ` +
                        `cylinders allocated, and a timeout of 20 seconds`,
                    SPECIFY_CYLS: `Create a ZFS with 100 primary and 10 secondary cylinders allocated`,
                    SPECIFY_VOLUMES: `Create a ZFS specifying the volumes that should be used`
                }
            },
            USSFILE: {
                SUMMARY: "Create a UNIX file",
                DESCRIPTION: "Create a UNIX file.",
                POSITIONALS: {
                    PATH: "The name of the file that you want to create."
                },
                OPTIONS: {
                    MODE: "Specifies the file permission bits to use when creating the file. "
                },
                EXAMPLES: {
                    CREATE_FILE: `Create a USS file named "test.ext" `,
                    SPECIFY_MODE: `Create a USS file named "text.txt" with mode "rwxrwxrwx" `
                }
            },
            USSDIR: {
                SUMMARY: "Create a UNIX directory",
                DESCRIPTION: "Create a UNIX directory.",
                POSITIONALS: {
                    PATH: "The name of the directory that you want to create."
                },
                OPTIONS: {
                    MODE: "Specifies the file permission bits to use when creating the directory."
                },
                EXAMPLES: {
                    CREATE_DIRECTORY: `Create a USS directory named "testDir" `,
                    SPECIFY_MODE: `Create a USS directory named "testDir" with mode "rwxrwxrwx" `
                }
            }
        },
        POSITIONALS: {
            DATASETNAME: "The name of the data set that you want to create"
        },
        OPTIONS: {
            VOLSER: "The volume serial (VOLSER) on which you want the data set to be placed. A VOLSER is analogous to a drive name on a PC.",
            UNIT: "The device type, also known as 'unit'",
            DSORG: "The data set organization",
            ALCUNIT: "The allocation unit (for example, CYL for Cylinders)",
            PRIMARY: "The primary space allocation (for example, 5)",
            SECONDARY: "The secondary space allocation (for example, 1)",
            DIRBLK: "The number of directory blocks (for example, 25)",
            AVGBLK: "The number of average blocks (for example, 25)",
            RECFM: `The record format for the data set (for example, FB for "Fixed Block")`,
            BLKSIZE: "The block size for the data set (for example, 6160)",
            LIKE: "Name of an existing data set to base your new data set's properties on",
            LRECL: "The logical record length. Analogous to the length of a line (for example, 80)",
            STORCLASS: "The SMS storage class to use for the allocation",
            MGNTCLASS: "The SMS management class to use for the allocation",
            DATACLASS: "The SMS data class to use for the allocation",
            DSNTYPE: "The data set type (BASIC, EXTPREF, EXTREQ, HFS, LARGE, PDS, LIBRARY, PIPE)",
            FLATFILE: "Indicates that you want to create the data set as a physical sequential file (flat file). A physical sequential file " +
            "differs from a partitioned data set (PDS) because it cannot contain members, only file contents.",
            SHOWATTRIBUTES: "Show the full allocation attributes",
            SIZE: "The size of the data set (specified as nCYL or nTRK - where n is the number of cylinders or tracks). Sets the primary " +
            "allocation (the secondary allocation becomes ~10% of the primary)."
        }
    },
    COPY: {
        SUMMARY: "Copy a data set",
        DESCRIPTION: "Copy a data set.",
        ACTIONS: {
            DATA_SET: {
                SUMMARY: "Copy a data set/partitioned data set to another data set/partitioned data set",
                DESCRIPTION: "Copy a data set/partitioned data set to another data set/partitioned data set.",
                POSITIONALS: {
                    FROMDSNAME: "The name of the data set that you want to copy from",
                    TODSNAME: "The name of the data set that you want to copy to"
                },
                OPTIONS: {
                    REPLACE: "Specify this option as true if you wish to replace members with identical names in the target data set",
                    SAFE_REPLACE: "Specify this option as true if you wish to replace members with identical names or the " +
                    "content of the target data set. This option will prompt to confirm.",
                    OVERWRITE: "Specify this option as true if you wish to replace the entire target data set with the source data set. " +
                    "All members, even those with no naming overlap, will be overwritten"
                },
                EXAMPLES: {
                    EX1: "Copy the data set named 'USER.FROM.SET' to the data set named 'USER.TO.SET'",
                    EX2: "Copy the data set member named 'USER.FROM.SET(MEM1)' to the data set member named 'USER.TO.SET(MEM2)'",
                    EX3: "Copy the data set named 'USER.FROM.SET' to the data set member named 'USER.TO.SET(MEM2)'",
                    EX4: "Copy the data set member named 'USER.FROM.SET(MEM1)' to the data set named 'USER.TO.SET'",
                    EX5: "Copy the data set named 'USER.FROM.SET' to the data set named 'USER.TO.SET' and replace members with identical names",
                    EX6: "Copy the partitioned data set named 'TEST.PDS1' to the partitioned data set named 'TEST.PDS2'",
                    EX7: "Copy the partitioned data set named 'EXISTING.PDS' to a non-existent target 'NEW.PDS'",
                    EX8: "Copy the partitioned data set named 'USER.FROM.SET' to the partitioned data set named 'USER.FROM.SET' and " +
                        "overwrite the original contents",
                }
            },
            DATA_SET_CROSS_LPAR: {
                SUMMARY: "Copy a data set to another data set on a specified LPAR",
                DESCRIPTION: "Copy a data set to another data set on a specified LPAR.",
                POSITIONALS: {
                    FROMDSNAME: "The name of the data set that you want to copy from",
                    TODSNAME: "The name of the data set that you want to copy to. If the data set does not " +
                    "exist it will be allocated automatically"
                },
                OPTIONS: {
                    REPLACE:         "Specify this option as true if you wish to replace the target data set if it already exists.",
                    TARGETHOST:      "The target z/OSMF server host name.",
                    TARGETPORT:      "The target z/OSMF server port.",
                    TARGETUSER:      "The target z/OSMF user name, which can be the same as your TSO login.",
                    TARGETPASS:      "The target z/OSMF password, which can be the same as your TSO password.",
                    TARGETTOKENVAL:  "The type of token to get and use for the API for the target system.",
                    TARGETTOKENTYPE: "The value of the token to pass to the API for the target system.",
                    TARGETPROFILE:   "The name of a z/OSMF profile to load for the target host.",
                    TARGETVOLSER:    "The volume serial (VOLSER) on which you want the target data set to be placed.",
                    TARGETMGTCLS:    "The SMS management class to use for the allocation of the target data set.",
                    TARGETDATACLS:   "The SMS data class to use for the allocation of the target data set.",
                    TARGETSTGCLS:    "The SMS storage class to use for the allocation of the target data set."
                },
                EXAMPLES: {
                    EX1: "Copy the data set named 'USER.FROM.SET' to the data set named 'USER.TO.SET' using the --target-zosmf-p" +
                         " option to specify the target host using a zosmf profile",
                    EX2: "Copy the data set member named 'USER.FROM.SET(MEM1)' to the data set member named 'USER.TO.SET(MEM2)'",
                    EX3: "Copy the data set named 'USER.FROM.SET' to the data set member named 'USER.TO.SET(MEM2)'",
                    EX4: "Copy the data set member named 'USER.FROM.SET(MEM1)' to the data set named 'USER.TO.SET' using the " +
                        "--target-host, --target-user, and --target-password options"
                }
            }
        }
    },
    DELETE: {
        SUMMARY: "Delete a data set or Unix System Services file",
        DESCRIPTION: "Delete a data set or Unix System Services file.",
        ACTIONS: {
            DATA_SET: {
                SUMMARY: "Delete a data set or data set member permanently",
                DESCRIPTION: "Delete a data set or data set member permanently.",
                POSITIONALS: {
                    DSNAME: "The name of the data set that you want to delete"
                },
                OPTIONS: {
                    VOLUME: "The volume serial (VOLSER) where the data set resides. The option is required only when the data set is not" +
                        " catalogued on the system.",
                    FOR_SURE: "Specify this option to confirm that you want to delete the data set permanently.",
                    IGNORE_NF: "Suppress errors if the data set does not exist."
                },
                EXAMPLES: {
                    EX1: "Delete the data set named 'ibmuser.cntl'",
                    EX2: "Delete the data set member named 'ibmuser.cntl(mem)'",
                    EX3: "Quietly delete a data set, suppressing errors if it doesn't exist"
                }
            },
            MIGRATED_DATA_SET: {
                SUMMARY: "Delete migrated data sets",
                DESCRIPTION: "Delete migrated data sets.",
                POSITIONALS: {
                    DATASETNAME: "The name of the migrated data set you want to delete."
                },
                OPTIONS: {
                    WAIT: "If true then the function waits for completion of the request. If false (default) the request is queued.",
                    PURGE: "If true then the function uses the PURGE=YES on ARCHDEL request. If false (default) the function uses the PURGE=NO on " +
                        "ARCHDEL request."
                },
                EXAMPLES: {
                    EX1: `Delete a migrated data set using default options`
                }
            },
            VSAM: {
                SUMMARY: "Delete a VSAM cluster permanently",
                DESCRIPTION: "Delete a VSAM cluster permanently.",
                POSITIONALS: {
                    DSNAME: "The name of the VSAM cluster that you want to delete"
                },
                OPTIONS: {
                    FOR_SURE: "Specify this option to confirm that you want to delete the VSAM cluster permanently.",
                    ERASE: "Specify this option to overwrite the data component for the cluster with binary zeros. This " +
                        "option is ignored if the NOERASE attribute was specified when the cluster was defined or altered.",
                    PURGE: "Specify this option to delete the VSAM cluster regardless of its retention period or date.",
                    IGNORE_NF: "Suppress errors if the VSAM data set does not exist."
                },
                EXAMPLES: {
                    EX1: "Delete the VSAM data set named 'ibmuser.cntl.vsam'",
                    EX2: "Quietly delete all VSAM data sets that match 'ibmuser.AAA.**.FFF' ignoring not-found errors",
                    EX3: "Delete a non-expired VSAM data set named 'ibmuser.cntl.vsam'",
                    EX4: "Delete an expired VSAM data set named 'ibmuser.cntl.vsam' by overwriting the components with zeros",
                    EX5: "Quietly delete VSAM data set, suppressing errors if it doesn't exist"
                }
            },
            USS: {
                SUMMARY: "Delete a Unix Systems Services (USS) file or directory permanently",
                DESCRIPTION: "Delete a Unix Systems Services (USS) file or directory permanently.",
                POSITIONALS: {
                    FILENAME: "The name of the file or directory that you want to delete"
                },
                OPTIONS: {
                    FOR_SURE: "Specify this option to confirm that you want to delete the file or directory permanently.",
                    RECURSIVE: "Delete directories recursively.",
                    IGNORE_NF: "Suppress errors if the file does not exist."
                },
                EXAMPLES: {
                    EX1: "Delete the empty directory '/u/ibmuser/testcases'",
                    EX2: "Delete the file named '/a/ibmuser/my_text.txt'",
                    EX3: "Recursively delete the directory named '/u/ibmuser/testcases'",
                    EX4: "Quietly delete a file, suppressing errors if the file doesn't exist"
                }
            },
            ZFS: {
                SUMMARY: "Delete a z/OS file system permanently",
                DESCRIPTION: "Delete a z/OS file system permanently.",
                POSITIONALS: {
                    FILESYSTEMNAME: "The name of the z/OS file system that you want to delete."
                },
                OPTIONS: {
                    FOR_SURE: "Specify this option to confirm that you want to delete the ZFS permanently.",
                    IGNORE_NF: "Suppress errors if the z/OS file does not exist."

                },
                EXAMPLES: {
                    EX1: "Delete the z/OS file system 'HLQ.MYNEW.ZFS'",
                    EX2: "Quietly delete a z/OS file, suppressing errors if the file doesn't exist"

                }
            }
        }
    },
    DOWNLOAD: {
        SUMMARY: "Download content from data sets and USS files",
        DESCRIPTION: "Download content from z/OS data sets and USS files to your PC.",
        ACTIONS: {
            ALL_MEMBERS: {
                SUMMARY: "Download all members from a PDS",
                DESCRIPTION: "Download all members from a partitioned data set to a local folder.",
                POSITIONALS: {
                    DATASETNAME: "The name of the data set from which you want to download members"
                },
                EXAMPLES: {
                    EX1: `Download the members of the data set "ibmuser.loadlib" in binary mode to the directory "loadlib/"`,
                    EX2: `Download the members of the data set "ibmuser.cntl" in text mode to the directory "jcl/"`
                }
            },
            ALL_MEMBERS_MATCHING: {
                SUMMARY: "Download all members from a PDS",
                DESCRIPTION: "Download all members that match a specific pattern from a partitioned data set to a local folder.",
                POSITIONALS: {
                    DATASETNAME: "The name of the data set from which you want to download members",
                    PATTERN: `The pattern or patterns to match members against. Also known as 'DSLEVEL'. The following special sequences can be ` +
                    `used in the pattern:
                    ${TextUtils.chalk.yellow("%")}: matches any single character
                    ${TextUtils.chalk.yellow("*")}: matches any number of characters within a member
                    You can specify multiple patterns separated by commas, for example "Mem*, Test*"`
                },
                EXAMPLES: {
                    EX1: `Download the members of the data set "ibmuser.loadlib" that begin with "Test" to the directory "loadlib/"`,
                    EX2: `Download the members of the data set "ibmuser.cntl" that begin with "Test" & "M" to the directory "output",
                    and exclude members that begin with "M2".`
                }
            },
            DATA_SET: {
                SUMMARY: "Download content from a z/OS data set",
                DESCRIPTION: "Download content from a z/OS data set to a local file.",
                POSITIONALS: {
                    DATASETNAME: "The name of the data set that you want to download"
                },
                EXAMPLES: {
                    EX1: `Download the data set "ibmuser.loadlib(main)" in binary mode to the local file "main.obj"`
                }
            },
            USS_FILE: {
                SUMMARY: "Download content from a USS file",
                DESCRIPTION: "Download content from a USS file to a local file on your PC.",
                POSITIONALS: {
                    USSFILENAME: "The name of the USS file you want to download"
                },
                EXAMPLES: {
                    EX1: `Download the file "/a/ibmuser/my_text.txt" to ./my_text.txt`,
                    EX2: `Download the file "/a/ibmuser/MyJava.class" to "java/MyJava.class" in binary mode`,
                    EX3: `Download the file "/a/ibmuser/MyJava.class" to "java/MyJava.class" using a .zosattributes file`
                }
            },
            USS_DIR: {
                SUMMARY: "Download content from a USS directory",
                DESCRIPTION: "Download content from a USS directory to a local directory on your PC.",
                POSITIONALS: {
                    USSDIRNAME: "The name of the USS directory you want to download"
                },
                EXAMPLES: {
                    EX1: `Download the directory "/a/ibmuser" to "./" in binary mode`,
                    EX2: `Download the directory "/a/ibmuser" to "./localDir"`,
                    EX3: `Download files from the directory "/a/ibmuser" that match the name "*.log" and were modified within the last day`
                }
            },
            DATA_SETS_MATCHING: {
                SUMMARY: "Download multiple data sets at once",
                DESCRIPTION: "Download all data sets that match a DSLEVEL pattern (see help below). " +
                    "You can use several options to qualify which data sets will be skipped and how the " +
                    "downloaded files will be structured. Data sets that are neither physical sequential nor " +
                    "partitioned data sets (with members) will be excluded.",
                POSITIONALS: {
                    PATTERN: `The pattern or patterns to match data sets against. Also known as 'DSLEVEL'. The following special sequences can be ` +
                    `used in the pattern:
                    ${TextUtils.chalk.yellow("%")}: matches any single character
                    ${TextUtils.chalk.yellow("*")}: matches any number of characters within a data set name qualifier ` +
                    `(e.g. "ibmuser.j*.old" matches "ibmuser.jcl.old" but not "ibmuser.jcl.very.old")
                    ${TextUtils.chalk.yellow("**")}: matches any number of characters within any number of data set name qualifiers ` +
                    `(e.g. "ibmuser.**.old" matches both "ibmuser.jcl.old" and "ibmuser.jcl.very.old")
                    However, the pattern cannot begin with any of these sequences. You can specify multiple patterns separated by commas, ` +
                    `for example "ibmuser.**.cntl,ibmuser.**.jcl"`
                },
                EXAMPLES: {
                    EX1: `Download all data sets beginning with "ibmuser" and ending with ".cntl" or ".jcl" to the local directory "jcl" to ` +
                        `files with the extension ".jcl"`,
                    EX2: `Download all data sets that begin with "ibmuser.public.project" or "ibmuser.project.private", excluding those that end ` +
                    `in "lib" to the local directory "project", providing a custom mapping of data set low level qualifier to local file extension`
                }
            }
        },
        OPTIONS: {
            ATTRIBUTES: "Path of an attributes file to control how files are downloaded.",
            VOLUME: "The volume serial (VOLSER) where the data set resides. You can use this option at any time. However, the VOLSER is required " +
                "only when the data set is not cataloged on the system. A VOLSER is analogous to a drive name on a PC.",
            BINARY: "Download the file content in binary mode, which means that no data conversion is performed. The data transfer process " +
                "returns each line as-is, without translation. No delimiters are added between records.",
            RECORD: "Download the file content in record mode, which means that no data conversion is performed and the record length is prepended" +
                " to the data. The data transfer process returns each line as-is, without translation. No delimiters are added between records." +
                " Conflicts with binary.",
            ENCODING: "Download the file content with encoding mode, which means that data conversion is performed using the file encoding " +
                "specified.",
            FAIL_FAST: "Set this option to false to continue downloading data set members if one or more fail.",
            FAIL_FAST_USS: "Set this option to false to continue downloading USS files if one or more fail.",
            FILE: "The path to the local file where you want to download the content. When you omit the option, the command generates a file " +
                "name automatically for you.",
            EXTENSION: "Save the local files with a specified file extension. For example, .txt. Or \"\" for no extension. When no extension " +
                "is specified, .txt is used as the default file extension.",
            DIRECTORY: "The directory to where you want to save the members. The command creates the directory for you when it does not already " +
                "exist. By default, the command creates a folder structure based on the data set qualifiers. For example, the data set " +
                "ibmuser.new.cntl's members are downloaded to ibmuser/new/cntl).",
            DIRECTORY_USS: "The directory to where you want to save the files. The command creates the directory for you when it does not already " +
                "exist. By default, the command downloads the files to the current directory.",
            EXTENSION_MAP: `Use this option to map data set names that match your pattern to the desired extension. A comma delimited key value ` +
                `pairing (e.g. "cntl=.jcl,cpgm=.c" to map the last segment of each data set (also known as the "low level qualifier" to the ` +
                `desired local file extension).`,
            EXCLUDE_PATTERN: "Exclude data sets that match these DSLEVEL patterns. Any data sets that match" +
                " this pattern will not be downloaded.",
            MAX_CONCURRENT_REQUESTS: "Specifies the maximum number of concurrent z/OSMF REST API requests to download members." +
                " Increasing the value results in faster downloads. " +
                "However, increasing the value increases resource consumption on z/OS and can be prone " +
                "to errors caused by making too many concurrent requests. If the download process encounters an error, " +
                "the following message displays:\n" +
                "The maximum number of TSO address spaces have been created. When you specify 0, " +
                Constants.DISPLAY_NAME + " attempts to download all members at once" +
                " without a maximum number of concurrent requests. ",
            MAX_CONCURRENT_REQUESTS_USS: "Specifies the maximum number of concurrent z/OSMF REST API requests to download files." +
                " Increasing the value results in faster downloads. " +
                "However, increasing the value increases resource consumption on z/OS and can be prone " +
                "to errors caused by making too many concurrent requests. If the download process encounters an error, " +
                "the following message displays:\n" +
                "The maximum number of TSO address spaces have been created. When you specify 0, " +
                Constants.DISPLAY_NAME + " attempts to download all files at once" +
                " without a maximum number of concurrent requests. ",
            PRESERVE_ORIGINAL_LETTER_CASE: "Specifies if the automatically generated directories and files use the original letter case.",
            INCLUDE_HIDDEN: "Include hidden files and folders that have names beginning with a dot.",
            OVERWRITE: "Overwrite files that already exist in your local environment."
        }
    },
    INVOKE: {
        SUMMARY: "Invoke various z/OS utilities",
        DESCRIPTION: "Invoke z/OS utilities such as Access Method Services (AMS).",
        ACTIONS: {
            AMS: {
                DESCRIPTION: "Submit control statements for execution by Access Method Services (IDCAMS). You can use IDCAMS to create VSAM data " +
                    "sets (CSI, ZFS, etc...), delete data sets, and more. You must format the control statements exactly as the IDCAMS utility " +
                    "expects. For more information about control statements, see the IBM publication 'z/OS DFSMS Access Method Services Commands'.",
                FILE_CMD: {
                    SUMMARY: "Invoke AMS to submit a file",
                    POSITIONAL: "The path to a file that contains IDCAMS control statements. Ensure that your file does not contain " +
                        "statements that are longer than 255 characters (maximum allowed length).",
                    EXAMPLES: {
                        EX1: "Reads the specified file and submits the controls statements"
                    }
                },
                STATEMENTS_CMD: {
                    SUMMARY: "Invoke AMS to submit statements",
                    POSITIONAL: "The IDCAMS control statement that you want to submit. " +
                        Constants.DISPLAY_NAME + " attempts to split the inline control " +
                        "statement at 255 characters.",
                    EXAMPLES: {
                        EX1: "Defines a cluster named 'DUMMY.VSAM.CLUSTER'",
                        EX2: "Deletes a cluster named 'DUMMY.VSAM.CLUSTER'"
                    }
                }
            }
        }
    },
    LIST: {
        SUMMARY: "List the details for data sets and the members in the data sets",
        DESCRIPTION: "List data sets and data set members. Optionally, you can list their details and attributes.",
        ACTIONS: {
            ALL_MEMBERS: {
                SUMMARY: "List all members of a PDS",
                DESCRIPTION: "List all members of a partitioned data set. To view additional information about each member, use the --attributes " +
                    "option under the Options section of this help text.",
                POSITIONALS: {
                    DATASETNAME: "The name of the data set for which you want to list the members"
                },
                EXAMPLES: {
                    EX1: `Show members of the data set "ibmuser.asm"`,
                    EX2: `Show attributes of members of the data set "ibmuser.cntl"`,
                    EX3: `Show the first 5 members of the data set "ibmuser.cntl"`,
                    EX4: `Show the first 4 members of the data set "ibmuser.cntl" matching an input pattern"`
                }
            },
            DATA_SET: {
                SUMMARY: "List data sets",
                DESCRIPTION: "List data sets that match a pattern in the data set name.",
                POSITIONALS: {
                    DATASETNAME: "The name or pattern of the data set that you want to list"
                },
                EXAMPLES: {
                    EX1: `Show the data set "ibmuser.asm"`,
                    EX2: `Show attributes of the data set "ibmuser.cntl"`,
                    EX3: `Show all data sets of the user "ibmuser"`,
                    EX4: `Show attributes of all data sets of the user "ibmuser"`,
                    EX5: `Show the first 5 data sets of the user "ibmuser"`
                }
            },
            USS_FILE: {
                SUMMARY: "List USS files",
                DESCRIPTION: "List USS files and directories in a UNIX file path.",
                POSITIONALS: {
                    PATH: "The directory containing the files and directories to be listed"
                },
                EXAMPLES: {
                    EX1: `Show the files and directories in path '/u/ibmuser'`,
                    EX2: "Show the files and directories in path '/u/ibmuser displaying only the file or directory name",
                    EX3: "Show the files and directories in path '/u/ibmuser' displaying the headers associated with the file detail"
                }
            },
            FS: {
                SUMMARY: "Listing mounted z/OS filesystems",
                DESCRIPTION: "List all mounted filesystems, or the specific filesystem mounted at a given path, " +
                    "or the filesystem with a given filesystem name.",
                EXAMPLES: {
                    EX1: "To list all mounted filesystems",
                    EX2: "To list filesystems mounted to a specific path",
                    EX3: "To list filesystems mounted with a specific name"
                }
            }
        },
        OPTIONS: {
            VOLUME: "The volume serial (VOLSER) where the data set resides. You can use this option at any time. However, the VOLSER is required " +
                "only when the data set is not cataloged on the system. A VOLSER is analogous to a drive name on a PC.",
            ATTRIBUTES: "Display more information about each member. Data sets with an undefined record format display information related to " +
                "executable modules. Variable and fixed block data sets display information about when the members were created and modified.",
            MAXLENGTH: "The option --max-length specifies the maximum number of items to return. Skip this parameter to return all items." +
                " If you specify an incorrect value, the parameter returns up to 1000 items.",
            NAME: "Filters files in USS based on the name of the file or directory.",
            PATTERN: "The option --pattern specifies the match pattern used when listing members in a data set. The default is to match against " +
                "all members, e.g. \"*\".",
            PATH: "Specifies the path where the file system is mounted." +
                " This option and --fsname are mutually exclusive.",
            FSNAME: "Specifies the name of the mounted file system." +
                " This option and --path are mutually exclusive.",
            START: "An optional search parameter that specifies the first data set name to return in the response document.",
            GROUP: "Filters content in USS based on the owning group name or ID.",
            OWNER: "Filters content in USS based on the owning user name or ID.",
            MTIME: "Filters content in USS based on the last modification time." +
                " N - specify an exact number of days, +N - older than N days, -N - newer than N days ",
            SIZE: "Filters content in USS based on the size." +
                " Default units are bytes. Add a suffix of K for kilobytes, M for megabytes, or G for gigabytes." +
                " N - specify an exact file size, +N - larger than N size, -N - smaller than N size",
            PERM: "Filters content in USS based on the octal permissions string.",
            TYPE: "Filters content in USS based on the type of content." +
                " f - regular file, d - directory, l - symbolic link, p - FIFO named pipe, s - socket",
            DEPTH: "Filters content in USS based on the number of directories to traverse down.",
            FILESYS: "Filters content in USS based on the filesystem the data is on." +
                " true - all filesystems, false - same filesystem as search directory.",
            SYMLINKS: "Filters content in USS based on whether or not to follow symbolic links. true - report symlinks, false - follow symlinks"
        }
    },
    MOUNT: {
        SUMMARY: "Mount file systems",
        DESCRIPTION: "Mount z/OS UNIX file systems, such as HFS, ZFS, and more. This connects you to USS file systems.",
        ACTIONS: {
            FS: {
                SUMMARY: "Mount a file system",
                DESCRIPTION: "Mount a UNIX file system on a specified directory.",
                POSITIONALS: {
                    FILESYSTEMNAME: "The name of the file system to mount.",
                    MOUNTPOINT: "The directory to use as a mount point."
                },
                EXAMPLES: {
                    EX1: `Mount a z/OS file system using default options`,
                    EX2: `Mount a hierarchical file system with write access`
                },
                OPTIONS: {
                    FSTYPE: "Specify the file system type that you are going to mount. The name must match the TYPE operand on a FILESYSTYPE"
                        + " statement in the BPXPRMxx parmlib member for the file system.",
                    MODE: "Specify the mode for mounting the file system (rdonly - read-only, rdwr - read/write)."
                }
            }
        }
    },
    OPTIONS: {
        RESPONSETIMEOUT: "The maximum amount of time in seconds the z/OSMF Files TSO servlet should run before returning a response." +
        " Any request exceeding this amount of time will be terminated and return an error. Allowed values: 5 - 600"
    },
    SEARCH: {
        SUMMARY: "Search Files",
        DESCRIPTION: "Search files for a search term.",
        ACTIONS: {
            DS: {
                SUMMARY: "Search Data Sets and PDS Members",
                DESCRIPTION: "Search all data sets and PDS members that match the data set name for a search term.",
                POSITIONALS: {
                    PATTERN: `The pattern to match data sets against. Also known as 'DSLEVEL'. The following special sequences can be ` +
                    `used in the pattern:
                    ${TextUtils.chalk.yellow("%")}: matches any single character
                    ${TextUtils.chalk.yellow("*")}: matches any number of characters within a data set name qualifier ` +
                    `(e.g. "ibmuser.j*.old" matches "ibmuser.jcl.old" but not "ibmuser.jcl.very.old")
                    ${TextUtils.chalk.yellow("**")}: matches any number of characters within any number of data set name qualifiers ` +
                    `(e.g. "ibmuser.**.old" matches both "ibmuser.jcl.old" and "ibmuser.jcl.very.old")
                    However, the pattern cannot begin with any of these sequences. You can specify multiple patterns separated by commas, ` +
                    `for example "ibmuser.**.cntl,ibmuser.**.jcl"`
                },
                OPTIONS: {
                    CASESENSITIVE: "The search should be case sensitive",
                    MAINFRAMESEARCH: "Perform a preliminary search on the mainframe, reducing network traffic. However, this option " +
                    "does not work with data sets that contain binary data. This option should be omitted if any data sets may be in " +
                    "binary format. Failure to do so may result in an incomplete set of search results.",
                    MAX_CONCURRENT_REQUESTS: "Specifies the maximum number of concurrent z/OSMF REST API requests to search files. " +
                    "Increasing the value results in faster searches. " +
                    "However, increasing the value increases resource consumption on z/OS and can be prone " +
                    "to errors caused by making too many concurrent requests.",
                    TIMEOUT: "The number of seconds to search before timing out.",
                    ENCODING: "Search the file content with encoding mode, which means that data conversion is performed using the file encoding " +
                    "specified.",
                    REGEX: "Whether the search string is a regular expression.",
                },
                EXAMPLES: {
                    EX1: {
                        DESCRIPTION: "Search all of IBMUSER's data sets for 'ZOWE'",
                        OPTIONS: "'IBMUSER.*' 'ZOWE'"
                    },
                    EX2: {
                        DESCRIPTION: "Search all of IBMUSER's data sets for 'ZOWE' in uppercase only",
                        OPTIONS: "'IBMUSER.*' 'ZOWE' --case-sensitive"
                    },
                    EX3: {
                        DESCRIPTION: "Search all of IBMUSER's data sets for 'ZOWE', and time out in 1 minute",
                        OPTIONS: "'IBMUSER.*' 'ZOWE' --timeout 60"
                    },
                    EX4: {
                        DESCRIPTION: "Search all of IBMUSER's data sets for 'ZOWE', and perform 8 parallel tasks",
                        OPTIONS: "'IBMUSER.*' 'ZOWE' --max-concurrent-requests 8"
                    },
                    EX5: {
                        DESCRIPTION: "Search all of IBMUSER's data sets using a regular expression",
                        OPTIONS: "'IBMUSER.*' 'Z([A-Za-z]){3}' --regex"
                    }
                }
            }
        },
        OPTIONS: {
            SEARCHSTRING: "The parameter to search for.",
        }
    },
    UNMOUNT: {
        SUMMARY: "Unmount file systems",
        DESCRIPTION: "Unmount file systems, such as HFS, ZFS, and more. This disconnects you from USS file systems.",
        ACTIONS: {
            FS: {
                SUMMARY: "Unmount a file system",
                DESCRIPTION: "Unmount a UNIX file system.",
                POSITIONALS: {
                    FILESYSTEMNAME: "The name of the file system to unmount."
                },
                EXAMPLES: {
                    EX1: "Unmount a mounted file system"
                }
            }
        }
    },
    UPLOAD: {
        SUMMARY: "Upload the contents of a file to data sets",
        DESCRIPTION: "Upload the contents of a file to data sets.",
        ACTIONS: {
            DIR_TO_PDS: {
                SUMMARY: "Upload files from a local directory to a partitioned data set (PDS)",
                DESCRIPTION: "Upload files from a local directory to a partitioned data set (PDS).",
                POSITIONALS: {
                    INPUTDIR: "The path for a local directory that you want to upload to a PDS",
                    DATASETNAME: "The name of the partitioned data set to which you want to upload the files"
                },
                EXAMPLES: {
                    EX1: `Upload a directory named "src" to a PDS named "ibmuser.src"`,
                    EX2: `Upload a directory named "src" to a migrated PDS named "ibmuser.src" and wait for it to be recalled`
                }
            },
            FILE_TO_DATA_SET: {
                SUMMARY: "Upload the contents of a file to a z/OS data set",
                DESCRIPTION: "Upload the contents of a file to a z/OS data set.",
                POSITIONALS: {
                    INPUTFILE: "The local file that you want to upload to a data set",
                    DATASETNAME: "The name of the data set to which you want to upload the file"
                },
                EXAMPLES: {
                    EX1: `Upload file contents to a sequential data set named "ibmuser.ps"`,
                    EX2: `Upload file contents to a PDS member named "ibmuser.pds(mem)"`,
                    EX3: `Upload file contents to a migrated data set and wait for it to be recalled`
                }
            },
            STDIN_TO_DATA_SET: {
                SUMMARY: "Upload the content of a stdin to a z/OS data set",
                DESCRIPTION: "Upload the content of a stdin to a z/OS data set.",
                POSITIONALS: {
                    DATASETNAME: "The name of the data set to which you want to upload data"
                },
                EXAMPLES: {
                    EX1: `Stream content from stdin to a sequential data set named "ibmuser.ps" from a Windows console`,
                    EX2: `Stream content from stdin to a partition data set member named "ibmuser.pds(mem)" from a Windows console`,
                    EX3: `Stream content from stdin to a migrated data set and wait for it to be recalled from a Windows console`
                }
            },
            FILE_TO_USS: {
                SUMMARY: "Upload content to a USS file from local file",
                DESCRIPTION: "Upload content to a USS file from local file.",
                POSITIONALS: {
                    INPUTFILE: "The local file that you want to upload to a USS file",
                    USSFILENAME: "The name of the USS file to which you want to upload the file"
                },
                EXAMPLES: {
                    EX1: `Upload to the USS file "/a/ibmuser/my_text.txt" from the file "file.txt"`
                }
            },
            DIR_TO_USS: {
                SUMMARY: "Upload a local directory to a USS directory",
                DESCRIPTION: "Upload a local directory to a USS directory.\n\n" +
                    "An optional .zosattributes file in the source directory can be used to control file conversion and tagging.\n\n" +
                    "An example .zosattributes file:{{space}}{{space}}\n" +
                    "# pattern        local-encoding        remote-encoding{{space}}{{space}}\n" +
                    "# Don't upload the node_modules directory{{space}}{{space}}\n" +
                    "node_modules     -{{space}}{{space}}\n" +
                    "# Don't upload files that start with periods{{space}}{{space}}\n" +
                    ".*               -{{space}}{{space}}\n" +
                    "# Upload jpg images in binary{{space}}{{space}}\n" +
                    "*.jpg            binary                binary{{space}}{{space}}\n" +
                    "# Convert CICS Node.js profiles to EBCDIC{{space}}{{space}}\n" +
                    "*.profile        ISO8859-1             EBCDIC{{space}}{{space}}\n\n" +
                    "Lines starting with the ‘#’ character are comments. Each line can specify up to three positional attributes:\n" +

                    "{{bullet}} A pattern to match a set of files. Pattern-matching syntax follows the same rules as those that apply " +
                    "in .gitignore files (note that negated patterns that begin with ‘!’ are not supported). " +
                    "See https://git-scm.com/docs/gitignore#_pattern_format.\n" +
                    "{{bullet}} A local-encoding to identify a file’s encoding on the local workstation. If '-' is specified for local-encoding," +
                    "files that match the pattern are not transferred.\n" +
                    "{{bullet}} A remote-encoding to specify the file’s desired character set on USS. This attribute must either match the local " +
                    "encoding or be set to EBCDIC. If set to EBCDIC, files are transferred in text mode and converted, otherwise they are " +
                    "transferred in binary mode. Remote files are tagged either with the remote encoding or as binary.\n\n" +
                    "A .zosattributes file can either be placed in the top-level directory you want to upload, or its location can be specified by " +
                    "using the --attributes parameter. .zosattributes files that are placed in nested directories are ignored.\n",

                POSITIONALS: {
                    INPUTDIR: "The local directory path that you want to upload to a USS directory",
                    USSDIR: "The name of the USS directory to which you want to upload the local directory"
                },
                EXAMPLES: {
                    EX1: `Upload all files from the "local_dir" directory to the "/a/ibmuser/my_dir" USS directory`,
                    EX2: `Upload all files from the "local_dir" directory and all its sub-directories, ` +
                        `to the "/a/ibmuser/my_dir" USS directory`,
                    EX3: `Upload all files from the "local_dir" directory to the "/a/ibmuser/my_dir" USS directory ` +
                        `in default ASCII mode, while specifying a list of file names (without path) to be uploaded in binary mode`,
                    EX4: `Upload all files from the "local_dir" directory to the "/a/ibmuser/my_dir" USS directory ` +
                        `in binary mode, while specifying a list of file names (without path) to be uploaded in ASCII mode`,
                    EX5: `Recursively upload all files from the "local_dir" directory to the "/a/ibmuser/my_dir" USS directory, ` +
                        `specifying files to ignore and file encodings in the local file my_global_attributes`,
                    EX6: `Upload all files from the "local_dir" directory to the "/a/ibmuser/my_dir" USS directory using IBM-1047 encoding`,
                }
            }
        },
        OPTIONS: {
            VOLUME: "The volume serial (VOLSER) where the data set resides. You can use this option at any time. However, the VOLSER is required " +
                "only when the data set is not cataloged on the system. A VOLSER is analogous to a drive name on a PC.",
            BINARY: "Data content in binary mode, which means that no data conversion is performed. The data transfer process " +
                "returns each record as-is, without translation. No delimiters are added between records.",
            RECORD: "Data content in record mode, which means that no data conversion is performed and the record length is prepended" +
                " to the data. The data transfer process returns each line as-is, without translation. No delimiters are added between records." +
                " Conflicts with binary.",
            ENCODING: "Data content in encoding mode, which means that data conversion is performed according to the encoding specified.",
            RECALL: "The method by which migrated data set is handled. By default, a migrated data set is recalled synchronously. You can " +
                "specify the following values: wait, nowait, error",
            RECURSIVE: "Upload all directories recursively.",
            BINARY_FILES: "Comma separated list of file names to be uploaded in binary mode. " +
                "Use this option when you upload a directory in default ASCII mode, " +
                "but you want to specify certain files to be uploaded in binary mode. " +
                "All files matching specified file names will be uploaded in binary mode. " +
                "If a .zosattributes file (or equivalent file specified via --attributes) is present, " +
                "--binary-files will be ignored.",
            ASCII_FILES: "Comma separated list of file names to be uploaded in ASCII mode. " +
                "Use this option when you upload a directory with --binary/-b flag, " +
                "but you want to specify certain files to be uploaded in ASCII mode. " +
                "All files matching specified file names will be uploaded in ASCII mode. " +
                "If a .zosattributes file (or equivalent file specified via --attributes) is present, " +
                "--ascii-files will be ignored.",
            ATTRIBUTES: "Path of an attributes file to control how files are uploaded.",
            MAX_CONCURRENT_REQUESTS: "Specifies the maximum number of concurrent z/OSMF REST API requests to upload files." +
                " Increasing the value results in faster uploads. " +
                "However, increasing the value increases resource consumption on z/OS and can be prone " +
                "to errors caused by making too many concurrent requests. If the upload process encounters an error, " +
                "the following message displays:\n" +
                "The maximum number of TSO address spaces have been created. When you specify 0, " +
                Constants.DISPLAY_NAME + " attempts to upload all members at once" +
                " without a maximum number of concurrent requests. ",
            INCLUDE_HIDDEN: "Include hidden files and folders that have names beginning with a dot."
        }
    },
    VIEW: {
        SUMMARY: "View the contents of a data set or USS file",
        DESCRIPTION: "View the contents of a data set or USS file on your terminal (stdout).",
        ACTIONS: {
            DATA_SET: {
                SUMMARY: "View content from a z/OS data set",
                DESCRIPTION: "View content from a z/OS data set on your terminal (stdout).",
                POSITIONALS: {
                    DATASETNAME: "The name of the data set you want to display."
                },
                EXAMPLES: {
                    EX1: `View the contents of the data set member "ibmuser.cntl(iefbr14)"`,
                    EX2: `View the contents of the data set member "ibmuser.test.loadlib(main)" in binary mode`,
                    EX3: `View only the first two lines of content for data set member "ibmuser.cntl(iefbr14)"`,
                    EX4: `View only lines six through eight (zero-based) in the contents of the data set member "ibmuser.cntl(iefbr14)"`
                }
            },
            USS_FILE: {
                SUMMARY: "View content from a USS file",
                DESCRIPTION: "View content from a Unix System Services (USS) file on your terminal (stdout).",
                POSITIONALS: {
                    USSFILE: "The name of the USS file you want to display."
                },
                EXAMPLES: {
                    EX1: `View the contents of the USS file "/a/ibmuser/my_text.txt"`,
                    EX2: `View the contents of the USS file "/a/ibmuser/MyJavaClass.class" in binary mode`
                }
            }
        },
        OPTIONS: {
            BINARY: "Transfer the file content in binary mode (no EBCDIC to ASCII conversion).",
            ENCODING: "Transfer the file content with encoding mode, which means that data conversion is performed using the file encoding " +
                "specified.",
            RECORD: "Transfer the file content in record mode, which means that no data conversion is performed and the record length is prepended" +
                " to the data. The data transfer process returns each line as-is, without translation. No delimiters are added between records." +
                " Conflicts with binary.",
            VOLUME: "The volume serial (VOLSER) where the data set resides. You can use this option at any time. However, the VOLSER is required " +
            "only when the data set is not cataloged on the system. A VOLSER is analogous to a drive name on a PC.",
            RANGE: "The range of records to return in either `SSS-EEE` or `SSS,NNN` format. SSS identifies the start record, EEE " +
            "identifies the end record, and NNN identifies the number of retrieved records."
        }
    },
    EDIT: {
        SUMMARY: "Edit the contents of a data set or USS file",
        DESCRIPTION: "Edit the contents of a data set or USS file with your terminal and default editor.",
        ACTIONS: {
            DATA_SET: {
                SUMMARY: "Edit content from a z/OS data set",
                DESCRIPTION: "Edit content from a z/OS data set with your terminal and default editor.",
                POSITIONALS: {
                    DATASETNAME: "The name of the data set you want to edit."
                },
                EXAMPLES: {
                    EX1: `Edit the contents of the data set member "ibmuser.cntl(iefbr14)"`,
                    EX2: `Edit the contents of the data set member "ibmuser.jcl(iefbr14)" and set extension as "jcl"`,
                    EX3: `Edit the contents of the data set member "ibmuser.jcl(iefbr14)" with binary flag set`,
                }
            },
            USS_FILE: {
                SUMMARY: "Edit content from a USS file",
                DESCRIPTION: "Edit content from a Unix System Services (USS) file with your terminal and default editor.",
                POSITIONALS: {
                    USSFILEPATH: "The path of the USS file you want to edit."
                },
                EXAMPLES: {
                    EX1: `Edit the contents of the USS file "/a/ibmuser/my_text.txt" in notepad`,
                    EX2: `Edit the contents of the USS file "/a/ibmuser/my_jcl.jcl" with binary flag set`,
                }
            }
        },
        OPTIONS: {
            EDITOR: `Editor that overrides the default editor for this file type. Set the option to the editor's executable file location ` +
            `or the program's name: ie "--editor notepad"`,
            EXTENSION: `Set the file extension of the file for editing to leverage an editor's file-type-specific formatting: ` +
            `ie "--extension jcl"`,
            BINARY: "Transfer the file content in binary mode (no EBCDIC to ASCII conversion).",
            ENCODING: "Transfer the file content with encoding mode, which means that data conversion is performed using the file encoding " +
                "specified."
        }
    },
    COMPARE: {
        SUMMARY: "Compare the contents of z/OS data sets or USS files",
        DESCRIPTION: "Compare the contents of z/OS data sets or USS files in your terminal (stdout).",
        ACTIONS: {
            DATA_SET: {
                SUMMARY: "Compare the contents of two z/OS data sets",
                DESCRIPTION: "Compare the contents of two z/OS data sets in your terminal (stdout).",
                POSITIONALS: {
                    DATASETNAME1: "The name of the first data set you want to compare.",
                    DATASETNAME2: "The name of the second data set you want to compare."
                },
                EXAMPLES: {
                    EX1: `Compare the contents of the data set members "sys1.samplib(antptso)" and "sys1.samplib(antxtso)"`,
                    EX2: `Compare the contents of the data set members "sys1.samplib(antptso)" and "sys1.samplib(antxtso)" without sequence numbers`
                }
            },
            LOCAL_FILE_DATA_SET: {
                SUMMARY: "Compare the contents of a local file and a z/OS data set",
                DESCRIPTION: "Compare the contents of a local file and a z/OS data set in your terminal (stdout).",
                POSITIONALS: {
                    LOCALFILEPATH: "The path of the local file you want to compare.",
                    DATASETNAME: "The name of the data set you want to compare."
                },
                EXAMPLES: {
                    EX1: `Compare the contents of the local file and the data set member "./a.txt" and "sys1.samplib(antxtso)"`,
                    EX2: `Compare the contents of the local file and the data set member "./a.txt" and "sys1.samplib(antxtso)" ` +
                     `without sequence numbers`
                }
            },
            USS_FILE: {
                SUMMARY: "Compare the contents of two z/OS USS files",
                DESCRIPTION: "Compare the contents of two z/OS USS files in your terminal (stdout).",
                POSITIONALS: {
                    USSFILEPATH1: "The path of the first USS file you want to compare.",
                    USSFILEPATH2: "The path of the second USS file you want to compare."
                },
                EXAMPLES: {
                    EX1: `Compare the contents of the USS file "/u/user/test.txt" and "/u/user/test.txt"`,
                    EX2: `Compare the contents of the USS file "/u/user/test.txt" and "/u/user/test.txt" without sequence numbers`
                }
            },
            LOCAL_FILE_USS_FILE: {
                SUMMARY: "Compare the contents of a local file and a z/OS USS file",
                DESCRIPTION: "Compare the contents of a local file and a z/OS USS file in your terminal (stdout).",
                POSITIONALS: {
                    LOCALFILEPATH: "The path of the local file you want to compare.",
                    USSFILEPATH: "The path of the USS file set you want to compare."
                },
                EXAMPLES: {
                    EX1: `Compare the contents of the local file and the USS file "./a.txt" and "/u/user/test.txt"`,
                    EX2: `Compare the contents of the local file and the USS file "./a.txt" and "/u/user/test.txt" ` +
                     `without sequence numbers`
                }
            },
            SPOOL_DD: {
                SUMMARY: "Compare the contents of two spool dds",
                DESCRIPTION: "Compare the contents of two spool dds in your terminal (stdout).",
                POSITIONALS: {
                    SPOOLDDDESCRIPTION1: "The name of the first job with the id of spool dd.",
                    SPOOLDDDESCRIPTION2: "The name of the second job with the id of spool dd."
                },
                EXAMPLES: {
                    EX1: `Compare the contents of the two spool dds "jobName1:jobId1:spoolId1"  "jobName2:jobId2:spoolId2"`,
                    EX2: `Compare the contents of the two spool dds "jobName1:jobId1:spoolId1"  "jobName2:jobId2:spoolId2" ` +
                     `without sequence numbers`
                }
            },
            LOCAL_FILE_SPOOL_DD: {
                SUMMARY: "Compare the contents of a local file and a spool dd",
                DESCRIPTION: "Compare the contents of a local file and a spool dd in your terminal (stdout).",
                POSITIONALS: {
                    LOCALFILEPATH: "The path of the local file you want to compare.",
                    SPOOLDDDESCRIPTION: "The name of the job with the id of spool dd."
                },
                EXAMPLES: {
                    EX1: `Compare the contents of a local-file and a spool dd "./a.txt"  "jobName:jobId:spoolId"`,
                    EX2: `Compare the contents of a local-file and a spool dd  "./a.txt"  "jobName:jobId:spoolId" ` +
                     `without sequence numbers`
                }
            },
        },
        OPTIONS: {
            BINARY: "Transfer the content of the first data set in binary mode (no EBCDIC to ASCII conversion). If binary mode is set " +
                "and the binary2 flag is not set then both data sets are transferred in binary mode.",
            BINARY2: "Transfer the content of the second data set in binary mode.",
            ENCODING: "Transfer the content of the first data set with encoding mode, which means that data conversion is performed " +
                "using the file encoding specified. If encoding mode is set and the encoding2 flag is not set both data sets are " +
                "transferred in encoding mode.",
            ENCODING2: "Transfer the content of the second data set with encoding mode.",
            RECORD: "Transfer the content for the first data set in record mode, which means that no data conversion is performed and the record " +
                "length is prepended to the data. The data transfer process returns each line as-is, without translation. No delimiters are " +
                "added between records. If encoding mode is set and the encoding2 flag is not set both data sets are transferred in " +
                "encoding mode. This option conflicts with binary mode.",
            RECORD2: "Transfer the content for the second data set in record mode. Conflicts with binary2.",
            VOLUME: "The volume serial (VOLSER) where the first data set resides. You can use this option at any time. However, the " +
                "VOLSER is required only when the data set is not cataloged on the system. A VOLSER is analogous to a drive name on a PC.",
            VOLUME2: "The volume serial (VOLSER) where the second data set resides.",
            SEQNUM: "If you are comparing two files that contain sequence numbers, this option controls if the sequences numbers are " +
                "removed from the end of each string. The default is to keep the sequence numbers. Use the --no-seqnum option to not " +
                "include them.",
            CONTEXTLINES: "The number of context lines that display before and after detected non-matching lines. By default all matching " +
                "lines display. If you want to limit the amount of data returned to only lines with differences use the context " +
                "lines option to reduce the matching lines to only those before and after non-matching lines. Using the value " +
                "of 0 strips all matching lines.",
            BROWSERVIEW: "Opens the diffs between two given files in browser."
        }
    },
    HMIGRATE: {
        SUMMARY: "Migrate data sets",
        DESCRIPTION: "Migrate data sets.",
        ACTIONS: {
            DATA_SET: {
                SUMMARY: "Migrate a data set",
                DESCRIPTION: "Migrate a data set.",
                POSITIONALS: {
                    DATASETNAME: "The name of the data set you want to migrate."
                },
                EXAMPLES: {
                    EX1: `Migrate a data set using default options`
                }
            }
        },
        OPTIONS: {
            WAIT: "If true then the function waits for completion of the request. If false (default) the request is queued."
        }
    },
    HRECALL: {
        SUMMARY: "Recall migrated data sets",
        DESCRIPTION: "Recall migrated data sets.",
        ACTIONS: {
            DATA_SET: {
                SUMMARY: "Recall a migrated data set",
                DESCRIPTION: "Recall a migrated data set.",
                POSITIONALS: {
                    DATASETNAME: "The name of the data set you want to recall."
                },
                EXAMPLES: {
                    EX1: `Recall a data set using default options`
                }
            }
        },
        OPTIONS: {
            WAIT: "If true then the function waits for completion of the request. If false (default) the request is queued."
        }
    },
    RENAME: {
        SUMMARY: "Rename a data set or member",
        DESCRIPTION: "Rename a data set or member.",
        ACTIONS: {
            DATA_SET: {
                SUMMARY: "Rename a data set",
                DESCRIPTION: "Rename a data set.",
                POSITIONALS: {
                    BEFOREDSNAME: "The name of the data set that you want to rename.",
                    AFTERDSNAME: "The name you want to rename the data set to."
                },
                OPTIONS: {
                },
                EXAMPLES: {
                    EX1: "Rename the data set named 'USER.BEFORE.SET' to 'USER.AFTER.SET.'"
                }
            },
            DATA_SET_MEMBER: {
                SUMMARY: "Rename a data set member",
                DESCRIPTION: "Rename a data set member.",
                POSITIONALS: {
                    DSNAME: "The name of the data set the member belongs to.",
                    BEFOREMEMBERNAME: "The name of the data set member that you want to rename.",
                    AFTERMEMBERNAME: "The name you want to rename the data set member to."
                },
                OPTIONS: {
                },
                EXAMPLES: {
                    EX1: "In the data set 'USER.DATA.SET', rename the member named 'MEM1' to 'MEM2'."
                }
            }
        }
    }
};
