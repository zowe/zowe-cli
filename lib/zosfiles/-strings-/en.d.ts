declare const _default: {
    COMMON: {
        ATTRIBUTE_TITLE: string;
        FOR: string;
        TO: string;
        WITH_VALUE: string;
    };
    CREATE: {
        DESCRIPTION: string;
        ACTIONS: {
            DATA_SET_BINARY: {
                DESCRIPTION: string;
                EXAMPLES: {
                    EX1: string;
                    EX2: string;
                };
            };
            DATA_SET_CLASSIC: {
                DESCRIPTION: string;
                EXAMPLES: {
                    EX1: string;
                    EX2: string;
                };
            };
            DATA_SET_C: {
                DESCRIPTION: string;
                EXAMPLES: {
                    EX1: string;
                    EX2: string;
                };
            };
            DATA_SET_LIKE: {
                DESCRIPTION: string;
                EXAMPLES: {
                    EX1: string;
                    EX2: string;
                    EX3: string;
                };
            };
            DATA_SET_PARTITIONED: {
                DESCRIPTION: string;
                EXAMPLES: {
                    EX1: string;
                    EX2: string;
                };
            };
            DATA_SET_SEQUENTIAL: {
                DESCRIPTION: string;
                EXAMPLES: {
                    EX1: string;
                };
            };
            VSAM: {
                DESCRIPTION: string;
                POSITIONALS: {
                    DATASETNAME: string;
                };
                OPTIONS: {
                    RETAINFOR: string;
                    RETAINTO: string;
                    SECONDARY: string;
                    SIZE: string;
                    VOLUMES: string;
                };
                EXAMPLES: {
                    DEFAULT_VALUES: string;
                    SHOW_FIVE_MB: string;
                    RETAIN_100_DAYS: string;
                };
            };
            ZFS: {
                SUMMARY: string;
                DESCRIPTION: string;
                POSITIONALS: {
                    FILESYSTEMNAME: string;
                };
                OPTIONS: {
                    OWNER: string;
                    GROUP: string;
                    PERMS: string;
                    CYLS_PRI: string;
                    CYLS_SEC: string;
                    VOLUMES: string;
                    TIMEOUT: string;
                };
                EXAMPLES: {
                    DEFAULT_VALUES: string;
                    SPECIFY_CYLS: string;
                    SPECIFY_VOLUMES: string;
                };
            };
            USSFILE: {
                SUMMARY: string;
                DESCRIPTION: string;
                POSITIONALS: {
                    PATH: string;
                };
                OPTIONS: {
                    MODE: string;
                };
                EXAMPLES: {
                    CREATE_FILE: string;
                    SPECIFY_MODE: string;
                };
            };
            USSDIR: {
                SUMMARY: string;
                DESCRIPTION: string;
                POSITIONALS: {
                    PATH: string;
                };
                OPTIONS: {
                    MODE: string;
                };
                EXAMPLES: {
                    CREATE_DIRECTORY: string;
                    SPECIFY_MODE: string;
                };
            };
        };
        POSITIONALS: {
            DATASETNAME: string;
        };
        OPTIONS: {
            VOLSER: string;
            UNIT: string;
            DSORG: string;
            ALCUNIT: string;
            PRIMARY: string;
            SECONDARY: string;
            DIRBLK: string;
            AVGBLK: string;
            RECFM: string;
            BLKSIZE: string;
            LIKE: string;
            LRECL: string;
            STORCLASS: string;
            MGNTCLASS: string;
            DATACLASS: string;
            DSNTYPE: string;
            FLATFILE: string;
            SHOWATTRIBUTES: string;
            SIZE: string;
        };
    };
    COPY: {
        DESCRIPTION: string;
        ACTIONS: {
            DATA_SET: {
                DESCRIPTION: string;
                POSITIONALS: {
                    FROMDSNAME: string;
                    TODSNAME: string;
                };
                OPTIONS: {
                    REPLACE: string;
                };
                EXAMPLES: {
                    EX1: string;
                    EX2: string;
                    EX3: string;
                    EX4: string;
                    EX5: string;
                };
            };
            DATA_SET_CROSS_LPAR: {
                DESCRIPTION: string;
                POSITIONALS: {
                    FROMDSNAME: string;
                    TODSNAME: string;
                };
                OPTIONS: {
                    REPLACE: string;
                    TARGETHOST: string;
                    TARGETPORT: string;
                    TARGETUSER: string;
                    TARGETPASS: string;
                    TARGETTOKENVAL: string;
                    TARGETTOKENTYPE: string;
                    TARGETPROFILE: string;
                    TARGETVOLSER: string;
                    TARGETMGTCLS: string;
                    TARGETDATACLS: string;
                    TARGETSTGCLS: string;
                };
                EXAMPLES: {
                    EX1: string;
                    EX2: string;
                    EX3: string;
                    EX4: string;
                };
            };
        };
    };
    DELETE: {
        DESCRIPTION: string;
        ACTIONS: {
            DATA_SET: {
                DESCRIPTION: string;
                POSITIONALS: {
                    DSNAME: string;
                };
                OPTIONS: {
                    VOLUME: string;
                    FOR_SURE: string;
                };
                EXAMPLES: {
                    EX1: string;
                    EX2: string;
                };
            };
            MIGRATED_DATA_SET: {
                DESCRIPTION: string;
                POSITIONALS: {
                    DATASETNAME: string;
                };
                OPTIONS: {
                    WAIT: string;
                    PURGE: string;
                };
                EXAMPLES: {
                    EX1: string;
                };
            };
            VSAM: {
                DESCRIPTION: string;
                POSITIONALS: {
                    DSNAME: string;
                };
                OPTIONS: {
                    FOR_SURE: string;
                    ERASE: string;
                    PURGE: string;
                };
                EXAMPLES: {
                    EX1: string;
                    EX2: string;
                    EX3: string;
                    EX4: string;
                };
            };
            USS: {
                DESCRIPTION: string;
                POSITIONALS: {
                    FILENAME: string;
                };
                OPTIONS: {
                    FOR_SURE: string;
                    RECURSIVE: string;
                };
                EXAMPLES: {
                    EX1: string;
                    EX2: string;
                    EX3: string;
                };
            };
            ZFS: {
                SUMMARY: string;
                DESCRIPTION: string;
                POSITIONALS: {
                    FILESYSTEMNAME: string;
                };
                OPTIONS: {
                    FOR_SURE: string;
                };
                EXAMPLES: {
                    EX1: string;
                };
            };
        };
    };
    DOWNLOAD: {
        SUMMARY: string;
        DESCRIPTION: string;
        ACTIONS: {
            ALL_MEMBERS: {
                SUMMARY: string;
                DESCRIPTION: string;
                POSITIONALS: {
                    DATASETNAME: string;
                };
                EXAMPLES: {
                    EX1: string;
                    EX2: string;
                };
            };
            DATA_SET: {
                SUMMARY: string;
                DESCRIPTION: string;
                POSITIONALS: {
                    DATASETNAME: string;
                };
                EXAMPLES: {
                    EX1: string;
                };
            };
            USS_FILE: {
                SUMMARY: string;
                DESCRIPTION: string;
                POSITIONALS: {
                    USSFILENAME: string;
                };
                EXAMPLES: {
                    EX1: string;
                    EX2: string;
                };
            };
            USS_DIR: {
                SUMMARY: string;
                DESCRIPTION: string;
                POSITIONALS: {
                    USSDIRNAME: string;
                };
                EXAMPLES: {
                    EX1: string;
                    EX2: string;
                    EX3: string;
                };
            };
            DATA_SETS_MATCHING: {
                SUMMARY: string;
                DESCRIPTION: string;
                POSITIONALS: {
                    PATTERN: string;
                };
                EXAMPLES: {
                    EX1: string;
                    EX2: string;
                };
            };
        };
        OPTIONS: {
            ATTRIBUTES: string;
            VOLUME: string;
            BINARY: string;
            RECORD: string;
            ENCODING: string;
            FAIL_FAST: string;
            FAIL_FAST_USS: string;
            FILE: string;
            EXTENSION: string;
            DIRECTORY: string;
            DIRECTORY_USS: string;
            EXTENSION_MAP: string;
            EXCLUDE_PATTERN: string;
            MAX_CONCURRENT_REQUESTS: string;
            MAX_CONCURRENT_REQUESTS_USS: string;
            PRESERVE_ORIGINAL_LETTER_CASE: string;
            INCLUDE_HIDDEN: string;
            OVERWRITE: string;
        };
    };
    INVOKE: {
        SUMMARY: string;
        DESCRIPTION: string;
        ACTIONS: {
            AMS: {
                DESCRIPTION: string;
                FILE_CMD: {
                    SUMMARY: string;
                    POSITIONAL: string;
                    EXAMPLES: {
                        EX1: string;
                    };
                };
                STATEMENTS_CMD: {
                    SUMMARY: string;
                    POSITIONAL: string;
                    EXAMPLES: {
                        EX1: string;
                        EX2: string;
                    };
                };
            };
        };
    };
    LIST: {
        SUMMARY: string;
        DESCRIPTION: string;
        ACTIONS: {
            ALL_MEMBERS: {
                SUMMARY: string;
                DESCRIPTION: string;
                POSITIONALS: {
                    DATASETNAME: string;
                };
                EXAMPLES: {
                    EX1: string;
                    EX2: string;
                    EX3: string;
                    EX4: string;
                };
            };
            DATA_SET: {
                SUMMARY: string;
                DESCRIPTION: string;
                POSITIONALS: {
                    DATASETNAME: string;
                };
                EXAMPLES: {
                    EX1: string;
                    EX2: string;
                    EX3: string;
                    EX4: string;
                    EX5: string;
                };
            };
            USS_FILE: {
                SUMMARY: string;
                DESCRIPTION: string;
                POSITIONALS: {
                    PATH: string;
                };
                EXAMPLES: {
                    EX1: string;
                    EX2: string;
                    EX3: string;
                };
            };
            FS: {
                SUMMARY: string;
                DESCRIPTION: string;
                EXAMPLES: {
                    EX1: string;
                    EX2: string;
                    EX3: string;
                };
            };
        };
        OPTIONS: {
            VOLUME: string;
            ATTRIBUTES: string;
            MAXLENGTH: string;
            NAME: string;
            PATTERN: string;
            PATH: string;
            FSNAME: string;
            START: string;
            GROUP: string;
            OWNER: string;
            MTIME: string;
            SIZE: string;
            PERM: string;
            TYPE: string;
            DEPTH: string;
            FILESYS: string;
            SYMLINKS: string;
        };
    };
    MOUNT: {
        SUMMARY: string;
        DESCRIPTION: string;
        ACTIONS: {
            FS: {
                SUMMARY: string;
                DESCRIPTION: string;
                POSITIONALS: {
                    FILESYSTEMNAME: string;
                    MOUNTPOINT: string;
                };
                EXAMPLES: {
                    EX1: string;
                    EX2: string;
                };
                OPTIONS: {
                    FSTYPE: string;
                    MODE: string;
                };
            };
        };
    };
    OPTIONS: {
        RESPONSETIMEOUT: string;
    };
    UNMOUNT: {
        SUMMARY: string;
        DESCRIPTION: string;
        ACTIONS: {
            FS: {
                SUMMARY: string;
                DESCRIPTION: string;
                POSITIONALS: {
                    FILESYSTEMNAME: string;
                };
                EXAMPLES: {
                    EX1: string;
                };
            };
        };
    };
    UPLOAD: {
        DESCRIPTION: string;
        ACTIONS: {
            DIR_TO_PDS: {
                DESCRIPTION: string;
                POSITIONALS: {
                    INPUTDIR: string;
                    DATASETNAME: string;
                };
                EXAMPLES: {
                    EX1: string;
                    EX2: string;
                };
            };
            FILE_TO_DATA_SET: {
                DESCRIPTION: string;
                POSITIONALS: {
                    INPUTFILE: string;
                    DATASETNAME: string;
                };
                EXAMPLES: {
                    EX1: string;
                    EX2: string;
                    EX3: string;
                };
            };
            STDIN_TO_DATA_SET: {
                DESCRIPTION: string;
                POSITIONALS: {
                    DATASETNAME: string;
                };
                EXAMPLES: {
                    EX1: string;
                    EX2: string;
                    EX3: string;
                };
            };
            FILE_TO_USS: {
                DESCRIPTION: string;
                POSITIONALS: {
                    INPUTFILE: string;
                    USSFILENAME: string;
                };
                EXAMPLES: {
                    EX1: string;
                };
            };
            DIR_TO_USS: {
                SUMMARY: string;
                DESCRIPTION: string;
                POSITIONALS: {
                    INPUTDIR: string;
                    USSDIR: string;
                };
                EXAMPLES: {
                    EX1: string;
                    EX2: string;
                    EX3: string;
                    EX4: string;
                    EX5: string;
                };
            };
        };
        OPTIONS: {
            VOLUME: string;
            BINARY: string;
            RECORD: string;
            ENCODING: string;
            RECALL: string;
            RECURSIVE: string;
            BINARY_FILES: string;
            ASCII_FILES: string;
            ATTRIBUTES: string;
            MAX_CONCURRENT_REQUESTS: string;
            INCLUDE_HIDDEN: string;
        };
    };
    VIEW: {
        SUMMARY: string;
        DESCRIPTION: string;
        ACTIONS: {
            DATA_SET: {
                SUMMARY: string;
                DESCRIPTION: string;
                POSITIONALS: {
                    DATASETNAME: string;
                };
                EXAMPLES: {
                    EX1: string;
                    EX2: string;
                    EX3: string;
                    EX4: string;
                };
            };
            USS_FILE: {
                SUMMARY: string;
                DESCRIPTION: string;
                POSITIONALS: {
                    USSFILE: string;
                };
                EXAMPLES: {
                    EX1: string;
                    EX2: string;
                };
            };
        };
        OPTIONS: {
            BINARY: string;
            ENCODING: string;
            RECORD: string;
            VOLUME: string;
            RANGE: string;
        };
    };
    EDIT: {
        SUMMARY: string;
        DESCRIPTION: string;
        ACTIONS: {
            DATA_SET: {
                SUMMARY: string;
                DESCRIPTION: string;
                POSITIONALS: {
                    DATASETNAME: string;
                };
                EXAMPLES: {
                    EX1: string;
                    EX2: string;
                };
            };
            USS_FILE: {
                SUMMARY: string;
                DESCRIPTION: string;
                POSITIONALS: {
                    USSFILEPATH: string;
                };
                EXAMPLES: {
                    EX1: string;
                    EX2: string;
                };
            };
        };
        OPTIONS: {
            EDITOR: string;
            EXTENSION: string;
        };
    };
    COMPARE: {
        SUMMARY: string;
        DESCRIPTION: string;
        ACTIONS: {
            DATA_SET: {
                SUMMARY: string;
                DESCRIPTION: string;
                POSITIONALS: {
                    DATASETNAME1: string;
                    DATASETNAME2: string;
                };
                EXAMPLES: {
                    EX1: string;
                    EX2: string;
                };
            };
            LOCAL_FILE_DATA_SET: {
                SUMMARY: string;
                DESCRIPTION: string;
                POSITIONALS: {
                    LOCALFILEPATH: string;
                    DATASETNAME: string;
                };
                EXAMPLES: {
                    EX1: string;
                    EX2: string;
                };
            };
            USS_FILE: {
                SUMMARY: string;
                DESCRIPTION: string;
                POSITIONALS: {
                    USSFILEPATH1: string;
                    USSFILEPATH2: string;
                };
                EXAMPLES: {
                    EX1: string;
                    EX2: string;
                };
            };
            LOCAL_FILE_USS_FILE: {
                SUMMARY: string;
                DESCRIPTION: string;
                POSITIONALS: {
                    LOCALFILEPATH: string;
                    USSFILEPATH: string;
                };
                EXAMPLES: {
                    EX1: string;
                    EX2: string;
                };
            };
            SPOOL_DD: {
                SUMMARY: string;
                DESCRIPTION: string;
                POSITIONALS: {
                    SPOOLDDDESCRIPTION1: string;
                    SPOOLDDDESCRIPTION2: string;
                };
                EXAMPLES: {
                    EX1: string;
                    EX2: string;
                };
            };
            LOCAL_FILE_SPOOL_DD: {
                SUMMARY: string;
                DESCRIPTION: string;
                POSITIONALS: {
                    LOCALFILEPATH: string;
                    SPOOLDDDESCRIPTION: string;
                };
                EXAMPLES: {
                    EX1: string;
                    EX2: string;
                };
            };
        };
        OPTIONS: {
            BINARY: string;
            BINARY2: string;
            ENCODING: string;
            ENCODING2: string;
            RECORD: string;
            RECORD2: string;
            VOLUME: string;
            VOLUME2: string;
            SEQNUM: string;
            CONTEXTLINES: string;
            BROWSERVIEW: string;
        };
    };
    HMIGRATE: {
        DESCRIPTION: string;
        ACTIONS: {
            DATA_SET: {
                DESCRIPTION: string;
                POSITIONALS: {
                    DATASETNAME: string;
                };
                EXAMPLES: {
                    EX1: string;
                };
            };
        };
        OPTIONS: {
            WAIT: string;
        };
    };
    HRECALL: {
        DESCRIPTION: string;
        ACTIONS: {
            DATA_SET: {
                DESCRIPTION: string;
                POSITIONALS: {
                    DATASETNAME: string;
                };
                EXAMPLES: {
                    EX1: string;
                };
            };
        };
        OPTIONS: {
            WAIT: string;
        };
    };
    RENAME: {
        DESCRIPTION: string;
        ACTIONS: {
            DATA_SET: {
                DESCRIPTION: string;
                POSITIONALS: {
                    BEFOREDSNAME: string;
                    AFTERDSNAME: string;
                };
                OPTIONS: {};
                EXAMPLES: {
                    EX1: string;
                };
            };
            DATA_SET_MEMBER: {
                DESCRIPTION: string;
                POSITIONALS: {
                    DSNAME: string;
                    BEFOREMEMBERNAME: string;
                    AFTERMEMBERNAME: string;
                };
                OPTIONS: {};
                EXAMPLES: {
                    EX1: string;
                };
            };
        };
    };
};
export default _default;
