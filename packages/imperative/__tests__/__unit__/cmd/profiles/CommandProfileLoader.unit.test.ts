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

jest.mock("../../../../src/profiles/BasicProfileManager");
jest.mock("../../../../src/profiles/BasicProfileManagerFactory");
jest.mock("../../../../src/utilities/ImperativeConfig");
jest.mock("../../../../src/logger/LoggerUtils");
import { CommandProfileLoader } from "../../../../src/cmd/profiles/CommandProfileLoader";
import { ICommandDefinition } from "../../../../src/cmd/doc/ICommandDefinition";
import { BasicProfileManager } from "../../../../src/profiles/BasicProfileManager";
import { TestLogger } from "../../../../__tests__/src/TestLogger";
import { CommandProfiles } from "../../../../src/cmd/profiles/CommandProfiles";
import { ImperativeError } from "../../../../src/error";
import { BasicProfileManagerFactory, IProfile, IProfileLoaded } from "../../../../src/profiles";
import { ImperativeConfig } from "../../../../src/utilities/ImperativeConfig";

const TEST_PROFILES_DIR = "/test/data/profiles/fake";

const PROFILE_BANANA_TYPE: string = "banana";
const STRAWBERRY_PROFILE_TYPE: string = "strawberry";

const SAMPLE_COMMAND_NO_PROFILE: ICommandDefinition = {
    name: PROFILE_BANANA_TYPE,
    description: "The banana command",
    type: "command"
};

const SAMPLE_COMMAND_PROFILE: ICommandDefinition = {
    name: PROFILE_BANANA_TYPE,
    description: "The banana command",
    type: "command",
    profile: {
        required: [PROFILE_BANANA_TYPE]
    }
};

const SAMPLE_COMMAND_TWO_PROFILE_TYPES: ICommandDefinition = {
    name: "bunch",
    description: "The banana command",
    type: "command",
    profile: {
        required: [PROFILE_BANANA_TYPE, STRAWBERRY_PROFILE_TYPE]
    }
};

const SAMPLE_COMMAND_TWO_PROFILE_TYPES_ONE_OPTIONAL: ICommandDefinition = {
    name: "bunch",
    description: "The banana command",
    type: "command",
    profile: {
        required: [PROFILE_BANANA_TYPE],
        optional: [STRAWBERRY_PROFILE_TYPE]
    }
};

const sampleRoot = __dirname + "/__tests__/__results__/data/";

describe("Command Profile Loader", () => {

    it("should allow us to create an instance", () => {
        const loader = CommandProfileLoader.loader({
            commandDefinition: SAMPLE_COMMAND_NO_PROFILE,
            profileManagerFactory: new BasicProfileManagerFactory(TEST_PROFILES_DIR),
            logger: TestLogger.getTestLogger()
        });
        expect(loader).toBeDefined();
    });

    it("should allow us to create an instance and load nothing", async () => {
        const loaded: CommandProfiles = await CommandProfileLoader.loader({
            commandDefinition: SAMPLE_COMMAND_NO_PROFILE,
            profileManagerFactory: new BasicProfileManagerFactory(TEST_PROFILES_DIR),
            logger: TestLogger.getTestLogger()
        }).loadProfiles({ _: undefined as any, $0: undefined as any });
        expect(loaded).toBeDefined();
    });

    it("should allow us to create an instance without a logger", () => {
        const loader = CommandProfileLoader.loader({
            commandDefinition: SAMPLE_COMMAND_NO_PROFILE,
            profileManagerFactory: new BasicProfileManagerFactory(TEST_PROFILES_DIR)
        });
        expect(loader).toBeDefined();
    });

    it("should allow us to create an instance (directly with constructor)", () => {
        const loader = new CommandProfileLoader(SAMPLE_COMMAND_NO_PROFILE,
            new BasicProfileManagerFactory(TEST_PROFILES_DIR));
        expect(loader).toBeDefined();
    });

    it("should detect a bad logger instance", () => {
        let error;
        try {
            const manager = new BasicProfileManagerFactory(TEST_PROFILES_DIR);
            let logger: any = TestLogger.getTestLogger();
            logger = {bad: "logger"};
            CommandProfileLoader.loader({
                commandDefinition: SAMPLE_COMMAND_NO_PROFILE,
                profileManagerFactory: manager,
                logger
            });
        } catch (e) {
            error = e;
        }
        expect(error).toBeDefined();
        expect(error instanceof ImperativeError).toBe(true);
        expect(error.message).toMatchSnapshot();
    });

    it("should detect missing command definitions when creating the loader", () => {
        let error;
        try {
            const manager = new BasicProfileManagerFactory(TEST_PROFILES_DIR);
            CommandProfileLoader.loader({
                commandDefinition: undefined as any,
                profileManagerFactory: manager,
                logger: TestLogger.getTestLogger()
            });
        } catch (e) {
            error = e;
        }
        expect(error).toBeDefined();
        expect(error instanceof ImperativeError).toBe(true);
        expect(error.message).toMatchSnapshot();
    });

    it("should detect missing profile manager when creating the loader", () => {
        let error;
        try {
            const manager = new BasicProfileManagerFactory(TEST_PROFILES_DIR);
            CommandProfileLoader.loader({
                commandDefinition: SAMPLE_COMMAND_NO_PROFILE,
                profileManagerFactory: undefined as any,
                logger: TestLogger.getTestLogger()
            });
        } catch (e) {
            error = e;
        }
        expect(error).toBeDefined();
        expect(error instanceof ImperativeError).toBe(true);
        expect(error.message).toMatchSnapshot();
    });

    it("should not load old profiles when in team-config mode", async () => {
        const manager = new BasicProfileManagerFactory(TEST_PROFILES_DIR);
        const profManager = new BasicProfileManager({
            logger: TestLogger.getTestLogger(),
            profileRootDirectory: sampleRoot,
            type: PROFILE_BANANA_TYPE
        });
        manager.getManager = jest.fn((type) => {
            return profManager;
        });
        profManager.load = jest.fn((parms) => Promise.resolve({
            message: "Profile Loaded",
            type: PROFILE_BANANA_TYPE,
            name: "tasty",
            failNotFound: true,
            profile: {
                name: "tasty",
                type: PROFILE_BANANA_TYPE,
            }
        }));

        // pretend that we have a team config
        ImperativeConfig.instance.config = {
            exists: true
        } as any;

        const emptyProfileMap: Map<string, IProfile[]> = new Map<string, IProfile[]>();
        const emptyProfileMetaMap: Map<string, IProfileLoaded[]> = new Map<string, IProfileLoaded[]>();
        const noProfilesLoaded = new CommandProfiles(emptyProfileMap, emptyProfileMetaMap);

        // because we have a team config, we should load no old-scemptyProfileMaphool profiles
        const loadedCmdProfiles: CommandProfiles = await CommandProfileLoader.loader({
            commandDefinition: SAMPLE_COMMAND_PROFILE,
            profileManagerFactory: manager,
            logger: TestLogger.getTestLogger()
        }).loadProfiles({ _: undefined as any, $0: undefined as any });

        expect(loadedCmdProfiles).toEqual(noProfilesLoaded);

        // restore to not having a team config for future tests
        ImperativeConfig.instance.config = {
            exists: false
        } as any;
    });

    it("should allow us to load a required profile", async () => {
        const manager = new BasicProfileManagerFactory(TEST_PROFILES_DIR);
        const profManager = new BasicProfileManager({
            logger: TestLogger.getTestLogger(),
            profileRootDirectory: sampleRoot,
            type: PROFILE_BANANA_TYPE
        });
        manager.getManager = jest.fn((type) => {
            return profManager;
        });
        profManager.load = jest.fn((parms) => Promise.resolve({
            message: "Profile Loaded",
            type: PROFILE_BANANA_TYPE,
            name: "tasty",
            failNotFound: true,
            profile: {
                name: "tasty",
                type: PROFILE_BANANA_TYPE,
            }
        }));
        const response = await CommandProfileLoader.loader({
            commandDefinition: SAMPLE_COMMAND_PROFILE,
            profileManagerFactory: manager,
            logger: TestLogger.getTestLogger()
        })
            .loadProfiles({ _: undefined as any, $0: undefined as any });
        expect(response.get(PROFILE_BANANA_TYPE)).toMatchSnapshot();
    });

    it("should percolate the load error to the caller", async () => {
        const manager = new BasicProfileManagerFactory(TEST_PROFILES_DIR);
        const profManager = new BasicProfileManager({
            logger: TestLogger.getTestLogger(),
            profileRootDirectory: sampleRoot,
            type: PROFILE_BANANA_TYPE
        });
        manager.getManager = jest.fn((type) => {
            return profManager;
        });
        profManager.load = jest.fn((parms) => {
            throw new ImperativeError({msg: `An error occurred during the load.`});
        });
        let error;
        try {
            const response = await CommandProfileLoader.loader({
                commandDefinition: SAMPLE_COMMAND_PROFILE,
                profileManagerFactory: manager,
                logger: TestLogger.getTestLogger()
            })
                .loadProfiles({ _: undefined as any, $0: undefined as any });
        } catch (e) {
            error = e;
        }
        expect(error).toBeDefined();
        expect(error instanceof ImperativeError).toBe(true);
        expect(error.message).toMatchSnapshot();
    });

    it("should react properly if the profile manager does not return an expected result for default", async () => {
        const manager = new BasicProfileManagerFactory(TEST_PROFILES_DIR);
        const profManager = new BasicProfileManager({
            logger: TestLogger.getTestLogger(),
            profileRootDirectory: sampleRoot,
            type: PROFILE_BANANA_TYPE
        });
        manager.getManager = jest.fn((type) => {
            return profManager;
        });
        profManager.load = jest.fn((parms) => Promise.resolve({} as any ));
        let error;
        try {
            const response = await CommandProfileLoader.loader({
                commandDefinition: SAMPLE_COMMAND_PROFILE,
                profileManagerFactory: manager,
                logger: TestLogger.getTestLogger()
            })
                .loadProfiles({ _: undefined as any, $0: undefined as any });
        } catch (e) {
            error = e;
        }
        expect(error).toBeDefined();
        expect(error instanceof ImperativeError).toBe(true);
        expect(error.message).toMatchSnapshot();
    });

    it("should react properly if the profile manager does not return an expected result", async () => {
        const manager = new BasicProfileManagerFactory(TEST_PROFILES_DIR);
        const profManager = new BasicProfileManager({
            logger: TestLogger.getTestLogger(),
            profileRootDirectory: sampleRoot,
            type: PROFILE_BANANA_TYPE
        });
        manager.getManager = jest.fn((type) => {
            return profManager;
        });
        profManager.load = jest.fn((parms) => Promise.resolve({} as any));
        let error;
        try {
            const response = await CommandProfileLoader.loader({
                commandDefinition: SAMPLE_COMMAND_PROFILE,
                profileManagerFactory: manager,
                logger: TestLogger.getTestLogger()
            })
                .loadProfiles({ "_": undefined as any, "$0": undefined as any, "banana-profile": "tasty"});
        } catch (e) {
            error = e;
        }
        expect(error).toBeDefined();
        expect(error instanceof ImperativeError).toBe(true);
        expect(error.message).toMatchSnapshot();
    });

    it("should allow us to load a required profile by name", async () => {
        const manager = new BasicProfileManagerFactory(TEST_PROFILES_DIR);
        const profManager = new BasicProfileManager({
            logger: TestLogger.getTestLogger(),
            profileRootDirectory: sampleRoot,
            type: PROFILE_BANANA_TYPE
        });
        manager.getManager = jest.fn((type) => {
            return profManager;
        });
        profManager.load = jest.fn((parms) => Promise.resolve({
            message: "Profile Loaded",
            type: PROFILE_BANANA_TYPE,
            name: "tasty",
            failNotFound: true,
            profile: {
                name: "tasty",
                type: PROFILE_BANANA_TYPE,
            }
        }));
        const response = await CommandProfileLoader.loader({
            commandDefinition: SAMPLE_COMMAND_PROFILE,
            profileManagerFactory: manager,
            logger: TestLogger.getTestLogger()
        })
            .loadProfiles({"_": undefined as any, "$0": undefined as any, "banana-profile": "tasty"});
        expect(response.get(PROFILE_BANANA_TYPE)).toMatchSnapshot();
    });

    it("should allow us to load a required profile by name with a dependency", async () => {
        const manager = new BasicProfileManagerFactory(TEST_PROFILES_DIR);
        const profManager = new BasicProfileManager({
            logger: TestLogger.getTestLogger(),
            profileRootDirectory: sampleRoot,
            type: PROFILE_BANANA_TYPE
        });
        manager.getManager = jest.fn((type) => {
            return profManager;
        });
        profManager.load = jest.fn((parms) => Promise.resolve({
            message: "Profile Loaded",
            type: PROFILE_BANANA_TYPE,
            name: "tasty",
            failNotFound: true,
            profile: {
                name: "tasty",
                type: PROFILE_BANANA_TYPE,
            },
            dependenciesLoaded: true,
            dependencyLoadResponses: [
                {
                    message: "Profile Loaded",
                    type: STRAWBERRY_PROFILE_TYPE,
                    name: "tasty",
                    failNotFound: true,
                    profile: {
                        name: "red",
                        type: STRAWBERRY_PROFILE_TYPE,
                    },
                }
            ]
        }));
        const response = await CommandProfileLoader.loader({
            commandDefinition: SAMPLE_COMMAND_PROFILE,
            profileManagerFactory: manager,
            logger: TestLogger.getTestLogger()
        })
            .loadProfiles({"_": undefined as any, "$0": undefined as any, "banana-profile": "tasty"});
        expect(response.get(PROFILE_BANANA_TYPE)).toMatchSnapshot();
        expect(response.get(STRAWBERRY_PROFILE_TYPE)).toMatchSnapshot();
    });

    it("should allow us to load two different required types", async () => {
        const manager = new BasicProfileManagerFactory(TEST_PROFILES_DIR);
        const profManagerBanana = new BasicProfileManager({
            logger: TestLogger.getTestLogger(),
            profileRootDirectory: sampleRoot,
            type: PROFILE_BANANA_TYPE
        });
        const profManagerStrawberry = new BasicProfileManager({
            logger: TestLogger.getTestLogger(),
            profileRootDirectory: sampleRoot,
            type: PROFILE_BANANA_TYPE
        });
        manager.getManager = jest.fn((type) => {
            if (type === PROFILE_BANANA_TYPE) {
                return profManagerBanana;
            }
            if (type === STRAWBERRY_PROFILE_TYPE) {
                return profManagerStrawberry;
            }
            return undefined as any;
        });
        profManagerBanana.load = jest.fn((parms) => Promise.resolve({
            message: "Profile Loaded",
            type: PROFILE_BANANA_TYPE,
            name: "tasty",
            failNotFound: true,
            profile: {
                name: "tasty",
                type: PROFILE_BANANA_TYPE,
            }
        }));
        profManagerStrawberry.load = jest.fn((parms) => Promise.resolve({
            message: "Profile Loaded",
            type: STRAWBERRY_PROFILE_TYPE,
            name: "tasty",
            failNotFound: true,
            profile: {
                name: "red",
                type: STRAWBERRY_PROFILE_TYPE,
            }
        }));
        const response = await CommandProfileLoader.loader({
            commandDefinition: SAMPLE_COMMAND_TWO_PROFILE_TYPES,
            profileManagerFactory: manager,
            logger: TestLogger.getTestLogger()
        })
            .loadProfiles({"_": undefined as any, "$0": undefined as any, "banana-profile": "tasty", "strawberry-profile": "red"});
        expect(response.get(PROFILE_BANANA_TYPE)).toMatchSnapshot();
        expect(response.get(STRAWBERRY_PROFILE_TYPE)).toMatchSnapshot();
    });

    it("should percolate the error if a required profile for one type is not found", async () => {
        const manager = new BasicProfileManagerFactory(TEST_PROFILES_DIR);
        const profManagerBanana = new BasicProfileManager({
            logger: TestLogger.getTestLogger(),
            profileRootDirectory: sampleRoot,
            type: PROFILE_BANANA_TYPE
        });
        const profManagerStrawberry = new BasicProfileManager({
            logger: TestLogger.getTestLogger(),
            profileRootDirectory: sampleRoot,
            type: PROFILE_BANANA_TYPE
        });
        manager.getManager = jest.fn((type) => {
            if (type === PROFILE_BANANA_TYPE) {
                return profManagerBanana;
            }
            if (type === STRAWBERRY_PROFILE_TYPE) {
                return profManagerStrawberry;
            }
            return undefined as any;
        });
        profManagerBanana.load = jest.fn((parms) => Promise.resolve({
            message: "Profile Loaded",
            type: PROFILE_BANANA_TYPE,
            name: "tasty",
            failNotFound: true,
            profile: {
                name: "tasty",
                type: PROFILE_BANANA_TYPE,
            }
        }));
        profManagerStrawberry.load = jest.fn((parms) => {
            throw new ImperativeError({msg: `Not found`});
        });
        let error;
        try {
            const response = await CommandProfileLoader.loader({
                commandDefinition: SAMPLE_COMMAND_TWO_PROFILE_TYPES,
                profileManagerFactory: manager,
                logger: TestLogger.getTestLogger()
            })
                .loadProfiles({"_": undefined as any, "$0": undefined as any, "banana-profile": "tasty", "strawberry-profile": "red"});
        } catch (e) {
            error = e;
        }
        expect(error).toBeDefined();
        expect(error instanceof ImperativeError).toBe(true);
        expect(error.message).toMatchSnapshot();
    });

    it("should handle multiple loads of the same type", async () => {
        const manager = new BasicProfileManagerFactory(TEST_PROFILES_DIR);
        const profManagerBanana = new BasicProfileManager({
            logger: TestLogger.getTestLogger(),
            profileRootDirectory: sampleRoot,
            type: PROFILE_BANANA_TYPE
        });
        manager.getManager = jest.fn((type) => {
            if (type === PROFILE_BANANA_TYPE) {
                return profManagerBanana;
            }
            return undefined as any;
        });
        profManagerBanana.load = jest.fn((parms) => Promise.resolve({
            message: "Profile Loaded",
            type: PROFILE_BANANA_TYPE,
            name: "tasty",
            failNotFound: true,
            profile: {
                name: "tasty",
                type: PROFILE_BANANA_TYPE,
            },
            dependenciesLoaded: true,
            dependencyLoadResponses: [
                {
                    message: "Profile Loaded",
                    type: PROFILE_BANANA_TYPE,
                    name: "great",
                    failNotFound: true,
                    profile: {
                        name: "great",
                        type: PROFILE_BANANA_TYPE,
                    },
                    dependenciesLoaded: true,
                    dependencyLoadResponses: [
                        {
                            message: "Profile Loaded",
                            type: PROFILE_BANANA_TYPE,
                            name: "awesome",
                            failNotFound: true,
                            profile: {
                                name: "awesome",
                                type: PROFILE_BANANA_TYPE,
                            },
                        }
                    ]
                }
            ]
        }));
        // commandDefinition: SAMPLE_COMMAND_TWO_PROFILE_TYPES_ONE_OPTIONAL,
        const response = await CommandProfileLoader.loader({
            commandDefinition: SAMPLE_COMMAND_PROFILE,
            profileManagerFactory: manager, logger:
        TestLogger.getTestLogger()
        }).loadProfiles({"_": undefined as any, "$0": undefined as any, "banana-profile": "tasty"});
        expect(response.getAll(PROFILE_BANANA_TYPE)[0]).toMatchSnapshot();
        expect(response.getAll(PROFILE_BANANA_TYPE)[1]).toMatchSnapshot();
        expect(response.getAll(PROFILE_BANANA_TYPE)[2]).toMatchSnapshot();
        expect(response.get(PROFILE_BANANA_TYPE)).toMatchSnapshot();
        expect(response.getAll(PROFILE_BANANA_TYPE)).toMatchSnapshot();
    });

    it("should handle load of required and optional profiles", async () => {
        const manager = new BasicProfileManagerFactory(TEST_PROFILES_DIR);
        const profManagerBanana = new BasicProfileManager({
            logger: TestLogger.getTestLogger(),
            profileRootDirectory: sampleRoot,
            type: PROFILE_BANANA_TYPE
        });
        const profManagerStrawberry = new BasicProfileManager({
            logger: TestLogger.getTestLogger(),
            profileRootDirectory: sampleRoot,
            type: STRAWBERRY_PROFILE_TYPE
        });
        manager.getManager = jest.fn((type) => {
            if (type === PROFILE_BANANA_TYPE) {
                return profManagerBanana;
            }
            if (type === STRAWBERRY_PROFILE_TYPE) {
                return profManagerStrawberry;
            }
            return undefined as any;
        });
        profManagerBanana.load = jest.fn((parms) => Promise.resolve({
            message: "Profile Loaded",
            type: PROFILE_BANANA_TYPE,
            name: "tasty",
            failNotFound: true,
            profile: {
                name: "tasty",
                type: PROFILE_BANANA_TYPE,
            }
        }));
        profManagerStrawberry.load = jest.fn((parms) => Promise.resolve({
            message: "Profile Loaded",
            type: STRAWBERRY_PROFILE_TYPE,
            name: "tasty",
            failNotFound: true,
            profile: {
                name: "red",
                type: STRAWBERRY_PROFILE_TYPE,
            }
        }));

        const response = await CommandProfileLoader.loader({
            commandDefinition: SAMPLE_COMMAND_TWO_PROFILE_TYPES_ONE_OPTIONAL,
            profileManagerFactory: manager, logger:
        TestLogger.getTestLogger()
        }).loadProfiles({"_": undefined as any, "$0": undefined as any, "banana-profile": "tasty", "strawberry-profile": "red"});
        expect(response.get(PROFILE_BANANA_TYPE)).toMatchSnapshot();
        expect(response.get(STRAWBERRY_PROFILE_TYPE)).toMatchSnapshot();
    });
});
