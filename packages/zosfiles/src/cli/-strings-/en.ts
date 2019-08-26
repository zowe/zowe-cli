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
import { Constants } from "../../../../Constants";

export default {
    COMMON: {
        ATTRIBUTE_TITLE: "The following attributes are used during creation:\n",
        FOR: "for",
        TO: "to",
        WITH_VALUE: "with value"
    },
    CREATE: {
        DESCRIPTION: "Create data sets",
        ACTIONS: {
            DATA_SET_BINARY: {
                DESCRIPTION: "Create executable data sets",
                EXAMPLES: {
                    EX1: "Create an empty binary partitioned data set (PDS) with default parameters"
                }
            },
            DATA_SET_CLASSIC: {
                DESCRIPTION: "Create classic data sets (JCL, HLASM, CBL, etc...)",
                EXAMPLES: {
                    EX1: "Create an empty z/OS 'classic' PDS with default parameters"
                }
            },
            DATA_SET_C: {
                DESCRIPTION: "Create data sets for C code programming",
                EXAMPLES: {
                    EX1: "Create an empty C code PDS with default parameters"
                }
            },
            DATA_SET_PARTITIONED: {
                DESCRIPTION: "Create partitioned data sets (PDS)",
                EXAMPLES: {
                    EX1: "Create an empty PDS with default parameters"
                }
            },
            DATA_SET_SEQUENTIAL: {
                DESCRIPTION: "Create physical sequential data sets (PS)",
                EXAMPLES: {
                    EX1: "Create an empty physical sequential data set with default parameters"
                }
            },
            VSAM: {
                DESCRIPTION: "Create a VSAM cluster",
                POSITIONALS: {
                    DATASETNAME: "The name of the dataset in which to create a VSAM cluster"
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
                    "(VOLSER). To specify more than one volume, separate each VOLSER with a space. You must specify the volumes option when your " +
                    "cluster is not SMS-managed.",
                    TIMEOUT: `The number of seconds to wait for the underlying "zfsadm format" command to complete. If this command times out, ` +
                    `the ZFS may have been created but not formatted correctly.`
                },
                EXAMPLES: {
                    DEFAULT_VALUES: `Create a ZFS named "HLQ.MYNEW.ZFS" using default values of 755 permissions, 10 primary and 2 secondary ` +
                    `cylinders allocated, and a timeout of 20 seconds`,
                    SPECIFY_CYLS: `Create a ZFS with 100 primary and 10 secondary cylinders allocated`,
                    SPECIFY_VOLUMES: `Create a ZFS specifying the volumes that should be used`
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
            LRECL: "The logical record length. Analogous to the length of a line (for example, 80)",
            STORECLASS: "The SMS storage class to use for the allocation",
            MGNTCLASS: "The SMS management class to use for the allocation",
            DATACLASS: "The SMS data class to use for the allocation",
            DSNTYPE: "The data set type",
            FLATFILE: "Indicates that you want to create the data set as a physical sequential file (flat file). A physical sequential file " +
                "differs from a partitioned data set (PDS) because it cannot contain members, only file contents.",
            SHOWATTRIBUTES: "Show the full allocation attributes",
            SIZE: "The size of the data set (specified as nCYL or nTRK - where n is the number of cylinders or tracks). Sets the primary " +
                "allocation (the secondary allocation becomes ~10% of the primary).",
        },
    },
    DELETE: {
        DESCRIPTION: "Delete a data set or Unix System Services file",
        ACTIONS: {
            DATA_SET: {
                DESCRIPTION: "Delete a data set permanently",
                POSITIONALS: {
                    DSNAME: "The name of the data set that you want to delete"
                },
                OPTIONS: {
                    VOLUME: "The volume serial (VOLSER) where the data set resides. The option is required only when the data set is not" +
                        " catalogued on the system.",
                    FOR_SURE: "Specify this option to confirm that you want to delete the data set permanently."
                },
                EXAMPLES: {
                    EX1: "Delete the data set named 'ibmuser.cntl'"
                }
            },
            VSAM: {
                DESCRIPTION: "Delete a VSAM cluster permanently",
                POSITIONALS: {
                    DSNAME: "The name of the VSAM cluster that you want to delete"
                },
                OPTIONS: {
                    FOR_SURE: "Specify this option to confirm that you want to delete the VSAM cluster permanently.",
                    ERASE: "Specify this option to overwrite the data component for the cluster with binary zeros. This " +
                        "option is ignored if the NOERASE attribute was specified when the cluster was defined or altered.",
                    PURGE: "Specify this option to delete the VSAM cluster regardless of its retention period or date."
                },
                EXAMPLES: {
                    EX1: "Delete the VSAM data set named 'ibmuser.cntl.vsam'",
                    EX2: "Delete all expired VSAM data sets that match 'ibmuser.AAA.**.FFF'",
                    EX3: "Delete a non-expired VSAM data set named 'ibmuser.cntl.vsam'",
                    EX4: "Delete an expired VSAM data set named 'ibmuser.cntl.vsam' by overwriting the components with zeros"
                }
            },
            USS: {
                DESCRIPTION: "Delete a Unix Systems Services (USS) File or directory permanently",
                POSITIONALS: {
                    FILENAME: "The name of the file or directory that you want to delete"
                },
                OPTIONS: {
                    FOR_SURE: "Specify this option to confirm that you want to delete the file or directory permanently.",
                    RECURSIVE: "Delete directories recursively.",
                },
                EXAMPLES: {
                    EX1: "Delete the empty directory '/u/ibmuser/testcases'",
                    EX2: "Delete the file named '/a/ibmuser/my_text.txt'",
                    EX3: "Recursively delete the directory named '/u/ibmuser/testcases'"
                }
            },
            ZFS: {
                SUMMARY: "Delete a z/OS file system permanently",
                DESCRIPTION: "Delete a z/OS file system permanently.",
                POSITIONALS: {
                    FILESYSTEMNAME: "The name of the z/OS file system that you want to delete."
                },
                OPTIONS: {
                    FOR_SURE: "Specify this option to confirm that you want to delete the ZFS permanently."
                },
                EXAMPLES: {
                    EX1: "Delete the z/OS file system 'HLQ.MYNEW.ZFS'"
                }
            }
        }
    },
    DOWNLOAD: {
        SUMMARY: "Download content from z/OS data sets and USS files",
        DESCRIPTION: "Download content from z/OS data sets and USS files to your PC",
        ACTIONS: {
            ALL_MEMBERS: {
                SUMMARY: "Download all members from a pds",
                DESCRIPTION: "Download all members from a partitioned data set to a local folder",
                POSITIONALS: {
                    DATASETNAME: "The name of the data set from which you want to download members"
                },
                EXAMPLES: {
                    EX1: `Download the members of the data set "ibmuser.loadlib" in binary mode to the directory "loadlib/"`,
                    EX2: `Download the members of the data set "ibmuser.cntl" in text mode to the directory "jcl/"`
                }
            },
            DATA_SET: {
                SUMMARY: "Download content from a z/OS data set",
                DESCRIPTION: "Download content from a z/OS data set to a local file",
                POSITIONALS: {
                    DATASETNAME: "The name of the data set that you want to download"
                },
                EXAMPLES: {
                    EX1: `Download the data set "ibmuser.loadlib(main)" in binary mode to the local file "main.obj"`
                }
            },
            USS_FILE: {
                SUMMARY: "Download content from a USS file",
                DESCRIPTION: "Download content from a USS file to a local file on your PC",
                POSITIONALS: {
                    USSFILENAME: "The name of the USS file you want to download"
                },
                EXAMPLES: {
                    EX1: `Download the file "/a/ibmuser/my_text.txt" to ./my_text.txt`,
                    EX2: `Download the file "/a/ibmuser/MyJava.class" to "java/MyJava.class" in binary mode`
                }
            },
            DATA_SETS_MATCHING: {
                SUMMARY: "Download multiple data sets at once",
                DESCRIPTION: "Download all data sets that match a DSLEVEL pattern (see help below). " +
                    "You can use several options to qualify which data sets will be skipped and how the " +
                    "downloaded files will be structured. Data sets that are neither physical sequential nor " +
                    "partitioned data sets (with members) will be excluded. ",
                POSITIONALS: {
                    PATTERN: `The pattern or patterns to match data sets against. Also known as 'DSLEVEL'. The
                    following special sequences can be used in the pattern:
                    ${TextUtils.chalk.yellow("%")}: matches any single character
                    ${TextUtils.chalk.yellow("*")}: matches any number of characters within a data set name qualifier (e.g.
                    "ibmuser.j*.old" matches "ibmuser.jcl.old" but not "ibmuser.jcl.very.old")
                    ${TextUtils.chalk.yellow("**")}: matches any number of characters within any number of data set name
                    qualifiers (e.g. "ibmuser.**.old" matches both "ibmuser.jcl.old" and
                    "ibmuser.jcl.very.old")
                    However, the pattern cannot begin with any of these sequences.You can specify
                    multiple patterns separated by commas, for example
                    "ibmuser.**.cntl,ibmuser.**.jcl"`,
                },
                EXAMPLES: {
                    EX1: `Download all data sets beginning with "ibmuser" and ending with
                    ".cntl" or ".jcl" to the local directory "jcl" to files with the extension ".jcl"`,
                    EX2: `Download all data sets that begin with "ibmuser.public.project" or
                    "ibmuser.project.private", excluding those that end in "lib" to the local
                    directory "project", providing a custom mapping of data set low level qualifier
                    to local file extension`
                }
            },
        },
        OPTIONS: {
            VOLUME: "The volume serial (VOLSER) where the data set resides. You can use this option at any time. However, the VOLSER is required " +
                "only when the data set is not cataloged on the system. A VOLSER is analogous to a drive name on a PC.",
            BINARY: "Download the file content in binary mode, which means that no data conversion is performed. The data transfer process " +
                "returns each line as-is, without translation. No delimiters are added between records.",
            FILE: "The path to the local file where you want to download the content. When you omit the option, the command generates a file " +
                "name automatically for you.",
            EXTENSION: "Save the local files with a specified file extension. For example, .txt. Or \"\" for no extension.  When no extension " +
                "is specified, .txt is used as the default file extension.",
            DIRECTORY: "The directory to where you want to save the members. The command creates the directory for you when it does not already " +
                "exist. By default, the command creates a folder structure based on the data set qualifiers. For example, the data set " +
                "ibmuser.new.cntl's members are downloaded to ibmuser/new/cntl).",
            EXTENSION_MAP: `Use this option to map data set names that match your pattern to the desired
            extension. A comma delimited key value pairing (e.g. "cntl=.jcl,cpgm=.c" to map
            the last segment of each data set (also known as the "low level qualifier" to
            the desired local file extension).`,
            EXCLUDE_PATTERN: "Exclude data sets that match these DSLEVEL patterns. Any data sets that match" +
                " this pattern will not be downloaded.",
            MAX_CONCURRENT_REQUESTS: "Specifies the maximum number of concurrent z/OSMF REST API requests to download members." +
                " Increasing the value results in faster downloads. " +
                "However, increasing the value increases resource consumption on z/OS and can be prone " +
                "to errors caused by making too many concurrent requests. If the download process encounters an error, " +
                "the following message displays:\n" +
                "The maximum number of TSO address spaces have been created. When you specify 0, " +
                Constants.DISPLAY_NAME + " attempts to download all members at once" +
                " without a maximum number of concurrent requests. "
        }
    },
    INVOKE: {
        SUMMARY: "Invoke various z/OS utilities",
        DESCRIPTION: "Invoke z/OS utilities such as Access Method Services (AMS)",
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
                        EX1: "Reads the specified file and submits the controls statements",
                    }
                },
                STATEMENTS_CMD: {
                    SUMMARY: "Invoke AMS to submit statements",
                    POSITIONAL: "The IDCAMS control statement that you want to submit. " +
                        Constants.DISPLAY_NAME + " attempts to split the inline control " +
                        "statement at 255 characters.",
                    EXAMPLES: {
                        EX1: "Defines a cluster named 'DUMMY.VSAM.CLUSTER'",
                        EX2: "Deletes a cluster named 'DUMMY.VSAM.CLUSTER'",
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
                SUMMARY: "List all members of a pds",
                DESCRIPTION: "List all members of a partitioned data set. To view additional information about each member, use the --attributes " +
                    "option under the Options section of this help text.",
                POSITIONALS: {
                    DATASETNAME: "The name of the data set for which you want to list the members"
                },
                EXAMPLES: {
                    EX1: `Show members of the data set "ibmuser.asm"`,
                    EX2: `Show attributes of members of the data set "ibmuser.cntl"`,
                    EX3: `Show the first 5 members of the data set "ibmuser.cntl"`
                }
            },
            DATA_SET: {
                SUMMARY: "List data sets",
                DESCRIPTION: "List data sets that match a pattern in the data set name",
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
                DESCRIPTION: "List USS files and directories in a UNIX file path",
                POSITIONALS: {
                    PATH: "The directory containing the files and directories to be listed"
                },
                EXAMPLES: {
                    EX1: `Show the files and directories in path '/u/ibmuser'`,
                    EX2: "Show the files and directories in path '/u/ibmuser displaying only the file or directory name",
                    EX3: "Show the files and directories in path '/u/ibmuser' displaying the headers associated with the file detail"
                }
            },
            ZFS: {
                SUMMARY: "Listing mounted z/OS file systems",
                DESCRIPTION: "List all mounted filesystems, or the specific filesystem mounted at a given path," +
                    "or the filesystem with a given Filesystem name.",
                EXAMPLES: {
                    EX1: "To list all mounted file systems",
                    EX2: "To list file systems mounted to a specific path",
                    EX3: "To list file systems mounted with a specific name"
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
            PATH: "Specifies the path where the file system is mounted." +
                " This option and --fsname are mutually exclusive.",
            FSNAME: "Specifies the name of the mounted file system." +
                " This option and --path are mutually exclusive."
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
                },
            }
        }
    },
    UPLOAD: {
        DESCRIPTION: "Upload the contents of a file to z/OS data sets",
        ACTIONS: {
            DIR_TO_PDS: {
                DESCRIPTION: "Upload files from a local directory to a partitioned data set (PDS)",
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
                DESCRIPTION: "Upload the contents of a file to a z/OS data set",
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
                DESCRIPTION: "Upload the content of a stdin to a z/OS data set",
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
                DESCRIPTION: "Upload content to a USS file from local file",
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
                "# Don't upload the node_modules directory{{space}}{{space}\n" +
                "node_modules     -{{space}}{{space}\n" +
                "# Don't upload files that start with periods{{space}}{{space}}\n" +
                ".*               - {{space}}{{space}\n" +
                "# Upload jpg images in binary{{space}}{{space}}\n" +
                "*.jpg            binary                binary{{space}}{{space}}\n" +
                "# Convert CICS Node.js profiles to EBCDIC{{space}}{{space}}\n" +
                "*.profile        ISO8859-1             EBCDIC{{space}}{{space}}\n\n" +
                "Lines starting with the ‘#’ character are comments. Each line can specify up to three positional attributes:\n"+

                "{{bullet}} A pattern to match a set of files. Pattern-matching syntax follows the same rules as those that apply in .gitignore "+
                "files (note that negated patterns that begin with ‘!’ are not supported). " +
                "See https://git-scm.com/docs/gitignore#_pattern_format.\n" +
                "{{bullet}} A local-encoding to identify a file’s encoding on the local workstation. If '-' is specified for local-encoding," +
                "files that match the pattern are not transferred.\n" +
                "{{bullet}} A remote-encoding to specify the file’s desired character set on USS. This attribute must either match the local " +
                "encoding or be set to EBCDIC. If set to EBCDIC, files are transferred in text mode and converted, otherwise they are transferred " +
                " in binary mode. Remote files are tagged either with the remote encoding or as binary. \n \n" +
                "Due to a z/OSMF limitation, files that are transferred in text mode are converted to the default EBCDIC code page on the " +
                "z/OS system. Therefore the only EBCDIC code page to specify as the remote encoding is the default code page for your system.\n\n " +
                "A .zosattributes file can either be placed in the top-level directory you want to upload, or its location can be specified by " +
                "using the --attributes parameter. .zosattributes files that are placed in nested directories are ignored.\n",

                POSITIONALS: {
                    INPUTDIR: "The local directory path that you want to upload to a USS directory",
                    USSDIR: "The name of the USS directory to which you want to upload the local directory"
                },
                EXAMPLES: {
                    EX1: `Upload all files from the "local_dir" directory to the "/a/ibmuser/my_dir" USS directory:"`,
                    EX2: `Upload all files from the "local_dir" directory and all its sub-directories, `+
                    `to the "/a/ibmuser/my_dir" USS directory:`,
                    EX3: `Upload all files from the "local_dir" directory to the "/a/ibmuser/my_dir" USS directory ` +
                    `in default ASCII mode, while specifying a list of file names (without path) to be uploaded in binary mode:`,
                    EX4: `Upload all files from the "local_dir" directory to the "/a/ibmuser/my_dir" USS directory ` +
                    `in binary mode, while specifying a list of file names (without path) to be uploaded in ASCII mode:`,
                    EX5: `Recursively upload all files from the "local_dir" directory to the "/a/ibmuser/my_dir" USS directory, ` +
                    `specifying files to ignore and file encodings in the local file my_global_attributes:`
                }
            },
        },
        OPTIONS: {
            VOLUME: "The volume serial (VOLSER) where the data set resides. You can use this option at any time. However, the VOLSER is required " +
                "only when the data set is not cataloged on the system. A VOLSER is analogous to a drive name on a PC.",
            BINARY: "Data content in binary mode, which means that no data conversion is performed. The data transfer process " +
                "returns each record as-is, without translation. No delimiters are added between records.",
            RECALL: "The method by which migrated data set is handled. By default, a migrated data set is recalled synchronously. You can " +
                "specify the following values: wait, nowait, error",
            RECURSIVE: "Upload all directories recursively.",
            BINARY_FILES: "Comma separated list of file names to be uploaded in binary mode. " +
            "Use this option when you upload a directory in default ASCII mode, " +
            "but you want to specify certain files to be uploaded in binary mode. " +
            "All files matching specified file names will be uploaded in binary mode. " +
            "If a .zosattributes file (or equivalent file specified via --attributes) is present, "+
            "--binary-files will be ignored.",
            ASCII_FILES: "Comma separated list of file names to be uploaded in ASCII mode. " +
            "Use this option when you upload a directory with --binary/-b flag, " +
            "but you want to specify certain files to be uploaded in ASCII mode. "  +
            "All files matching specified file names will be uploaded in ASCII mode. " +
            "If a .zosattributes file (or equivalent file specified via --attributes) is present, "+
            "--ascii-files will be ignored.",
            ATTRIBUTES: "Path of an attributes file to control how files are uploaded",
            MAX_CONCURRENT_REQUESTS: "Specifies the maximum number of concurrent z/OSMF REST API requests to upload files." +
            " Increasing the value results in faster uploads. " +
            "However, increasing the value increases resource consumption on z/OS and can be prone " +
            "to errors caused by making too many concurrent requests. If the upload process encounters an error, " +
            "the following message displays:\n" +
            "The maximum number of TSO address spaces have been created. When you specify 0, " +
            Constants.DISPLAY_NAME + " attempts to upload all members at once" +
            " without a maximum number of concurrent requests. "
        }
    }
};
