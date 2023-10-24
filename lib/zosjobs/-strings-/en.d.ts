declare const _default: {
    CANCEL: {
        SUMMARY: string;
        DESCRIPTION: string;
        ACTIONS: {
            JOB: {
                SUMMARY: string;
                DESCRIPTION: string;
                POSITIONALS: {
                    JOB_ID: string;
                };
                OPTIONS: {};
                EXAMPLES: {
                    EX1: {
                        DESCRIPTION: string;
                        OPTIONS: string;
                    };
                    EX2: {
                        DESCRIPTION: string;
                        OPTIONS: string;
                    };
                };
            };
        };
    };
    MODIFY: {
        SUMMARY: string;
        DESCRIPTION: string;
        ACTIONS: {
            JOB: {
                SUMMARY: string;
                DESCRIPTION: string;
                POSITIONALS: {
                    JOB_ID: string;
                };
                OPTIONS: {
                    JOB_CLASS: string;
                    HOLD: string;
                    RELEASE: string;
                };
                EXAMPLES: {
                    EX1: {
                        DESCRIPTION: string;
                        OPTIONS: string;
                    };
                    EX2: {
                        DESCRIPTION: string;
                        OPTIONS: string;
                    };
                    EX3: {
                        DESCRIPTION: string;
                        OPTIONS: string;
                    };
                };
            };
        };
    };
    DELETE: {
        SUMMARY: string;
        DESCRIPTION: string;
        ACTIONS: {
            JOB: {
                SUMMARY: string;
                DESCRIPTION: string;
                POSITIONALS: {
                    JOB_ID: string;
                };
                OPTIONS: {};
                EXAMPLES: {
                    EX1: {
                        DESCRIPTION: string;
                        OPTIONS: string;
                    };
                    EX2: {
                        DESCRIPTION: string;
                        OPTIONS: string;
                    };
                };
            };
            OLD_JOBS: {
                SUMMARY: string;
                DESCRIPTION: string;
                OPTIONS: {
                    PREFIX: string;
                    MAX_CONCURRENT_REQUESTS: string;
                };
                EXAMPLES: {
                    EX1: {
                        DESCRIPTION: string;
                        OPTIONS: string;
                    };
                };
            };
        };
    };
    DOWNLOAD: {};
    LIST: {};
    OPTIONS: {
        MODIFY_VERSION: string;
    };
    SUBMIT: {
        SUMMARY: string;
        DESCRIPTION: string;
        ACTIONS: {
            COMMON_OPT: {
                WAIT_FOR_ACTIVE: string;
                WAIT_FOR_OUTPUT: string;
                VIEW_ALL_SPOOL_CONTENT: string;
                DIRECTORY: string;
                EXTENSION: string;
                JCL_SYMBOLS: string;
            };
            DATA_SET: {
                SUMMARY: string;
                DESCRIPTION: string;
                POSITIONALS: {
                    DATASET: string;
                };
                OPTIONS: {
                    VOLUME: string;
                };
                EXAMPLES: {
                    EX1: {
                        DESCRIPTION: string;
                        OPTIONS: string;
                    };
                    EX2: {
                        DESCRIPTION: string;
                        OPTIONS: string;
                    };
                };
            };
            USS_FILE: {
                SUMMARY: string;
                DESCRIPTION: string;
                POSITIONALS: {
                    USSFILE: string;
                };
                EXAMPLES: {
                    EX1: {
                        DESCRIPTION: string;
                        OPTIONS: string;
                    };
                    EX2: {
                        DESCRIPTION: string;
                        OPTIONS: string;
                    };
                };
            };
            LOCAL_FILE: {
                SUMMARY: string;
                DESCRIPTION: string;
                POSITIONALS: {
                    NAME: string;
                };
                EXAMPLES: {
                    EX1: {
                        DESCRIPTION: string;
                        OPTIONS: string;
                    };
                };
            };
            STDIN: {
                SUMMARY: string;
                DESCRIPTION: string;
                EXAMPLES: {
                    EX1: {
                        DESCRIPTION: string;
                        OPTIONS: string;
                    };
                    EX2: {
                        DESCRIPTION: string;
                        OPTIONS: string;
                        PREFIX: string;
                    };
                };
            };
        };
    };
    VIEW: {};
};
export default _default;
