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

import { runCliScript } from "../../../../../../__resources__/src/TestUtil";
import { ITestEnvironment } from "../../../../../../__resources__/__src__/environment/doc/response/ITestEnvironment";
import { SetupTestEnvironment } from "../../../../../../__resources__/__src__/environment/SetupTestEnvironment";
import { join } from "path";
// Test Environment populated in the beforeAll();
let TEST_ENVIRONMENT: ITestEnvironment;
describe("cmd-cli profile mapping", () => {
    // Create the unique test environment
    beforeAll(async () => {
        TEST_ENVIRONMENT = await SetupTestEnvironment.createTestEnv({
            cliHomeEnvVar: "CMD_CLI_CLI_HOME",
            testName: "cmd_profile_mapping"
        });
    });

    afterEach(() => {
        // delete profiles between tests so that they can be recreated
        require("rimraf").sync(join(TEST_ENVIRONMENT.workingDir, "profiles"));
    });

    it("should map profile fields to required options", () => {
        const color = "yellow";
        const description = "A pretty good banana";
        const moldType = "none";
        const response = runCliScript(__dirname + "/__scripts__/profiles/map_banana_to_options.sh",
            TEST_ENVIRONMENT.workingDir, [color, description, moldType]);
        expect(response.stderr.toString()).toContain("The command 'profiles create' is deprecated.");
        expect(response.status).toBe(0);

        // the output of the command should use the profile values
        expect(response.stdout.toString()).toContain("Color: " + color);
        expect(response.stdout.toString()).toContain("Description: " + description);
        expect(response.stdout.toString()).toContain("Mold type: " + moldType);
        expect(response.stdout.toString()).toContain("Sweetness: mild");
    });

    it("should have command line arguments take precedence over profile fields", () => {
        const color = "yellow";
        const description = "A pretty good banana";
        const moldType = "none";
        // values used as command line arguments
        const cliColor = "yellow and black";
        const cliDescription = "A beautiful bunch of ripe banana hides the deadly black tarantula";
        const cliMoldType = "no mold at all";
        const response = runCliScript(__dirname + "/__scripts__/profiles/banana_profile_and_specify_cli.sh",
            TEST_ENVIRONMENT.workingDir, [color, description, moldType, cliColor, cliDescription, cliMoldType]);
        expect(response.stderr.toString()).toContain("The command 'profiles create' is deprecated.");
        expect(response.status).toBe(0);

        // the output of the command should use the CLI arguments
        expect(response.stdout.toString()).toContain("Color: " + cliColor);
        expect(response.stdout.toString()).toContain("Description: " + cliDescription);
        expect(response.stdout.toString()).toContain("Mold type: " + cliMoldType);
        expect(response.stdout.toString()).toContain("Sweetness: mild");
    });

    it("should have environmental variables take precedence over profile fields", () => {
        const color = "yellow";
        const description = "A pretty good banana";
        const moldType = "none";
        // values used as env variables
        const envColor = "yellow and black";
        const envDescription = "A beautiful bunch of ripe banana hides the deadly black tarantula";
        const envMoldType = "no mold at all";
        const response = runCliScript(__dirname + "/__scripts__/profiles/banana_profile_and_specify_env.sh",
            TEST_ENVIRONMENT.workingDir, [color, description, moldType, envColor, envDescription, envMoldType]);
        expect(response.stderr.toString()).toContain("The command 'profiles create' is deprecated.");
        expect(response.status).toBe(0);

        // the output of the command should use the env variable values
        expect(response.stdout.toString()).toContain("Color: " + envColor);
        expect(response.stdout.toString()).toContain("Description: " + envDescription);
        expect(response.stdout.toString()).toContain("Mold type: " + envMoldType);
        expect(response.stdout.toString()).toContain("Sweetness: mild");
    });

    it("should have command line arguments take precedence over profile fields and environmental variables", () => {
        const color = "yellow";
        const description = "A pretty good banana";
        const moldType = "none";
        // values used as env variables
        const envColor = "don't show me";
        const envDescription = "I shouldn't be shown";
        const envMoldType = "lots of mold";

        // values used as command line arguments
        const cliColor = "yellow and black";
        const cliDescription = "A beautiful bunch of ripe banana hides the deadly black tarantula";
        const cliMoldType = "no mold at all";

        const response = runCliScript(__dirname + "/__scripts__/profiles/banana_profile_and_specify_env_and_cli.sh",
            TEST_ENVIRONMENT.workingDir, [color, description, moldType, envColor, envDescription, envMoldType,
                cliColor, cliDescription, cliMoldType]);
        expect(response.stderr.toString()).toContain("The command 'profiles create' is deprecated.");
        expect(response.status).toBe(0);

        // the output of the command should use the CLI arguments
        expect(response.stdout.toString()).toContain("Color: " + cliColor);
        expect(response.stdout.toString()).toContain("Description: " + cliDescription);
        expect(response.stdout.toString()).toContain("Mold type: " + cliMoldType);
        expect(response.stdout.toString()).toContain("Sweetness: mild");
    });

    it("should have environmental variables take precedence over default values", () => {
        // values used as env variables
        const envSweetness = "very very";

        // values used as command line arguments
        const cliColor = "golden";
        const cliDescription = "delicious";
        const cliMoldType = "no mold at all";

        const response = runCliScript(__dirname + "/__scripts__/profiles/specify_env_sweetness.sh",
            TEST_ENVIRONMENT.workingDir, [cliColor, cliDescription, cliMoldType, envSweetness]);
        expect(response.stderr.toString()).toBe("");
        expect(response.status).toBe(0);

        // the output of the command should use the CLI arguments
        // except for sweetness which was specified by environmental variables
        expect(response.stdout.toString()).toContain("Color: " + cliColor);
        expect(response.stdout.toString()).toContain("Description: " + cliDescription);
        expect(response.stdout.toString()).toContain("Mold type: " + cliMoldType);
        expect(response.stdout.toString()).toContain("Sweetness: " + envSweetness);
    });

    it("should have service profile fields take precedence over base profile fields", () => {
        const baseAmount = 500;
        const basePrice = 2;
        const kiwiAmount = 1000;
        const response = runCliScript(__dirname + "/__scripts__/profiles/base_and_kiwi_profile.sh",
            TEST_ENVIRONMENT.workingDir, [baseAmount, basePrice, kiwiAmount]);
        expect(response.stderr.toString()).toContain("The command 'profiles create' is deprecated.");
        expect(response.status).toBe(0);

        // the output of the command should use the base profile values
        // except for amount which was specified in service profile
        expect(response.stdout.toString()).toContain(`Amount: ${kiwiAmount}`);
        expect(response.stdout.toString()).toContain(`Price: ${basePrice}`);
    });

    it("should be able to specify positional options via environmental variables", () => {
        // values used as env variables
        const envColor = "yellow and black";
        const envDescription = "A beautiful bunch of ripe banana hides the deadly black tarantula";
        const envMoldType = "no mold at all";
        const response = runCliScript(__dirname + "/__scripts__/profiles/specify_env_for_positional.sh",
            TEST_ENVIRONMENT.workingDir, [envColor, envDescription, envMoldType]);
        expect(response.stderr.toString()).toBe("");
        expect(response.status).toBe(0);

        // the output of the command should use the env variable values
        expect(response.stdout.toString()).toContain("Color: " + envColor);
        expect(response.stdout.toString()).toContain("Description: " + envDescription);
        expect(response.stdout.toString()).toContain("Mold type: " + envMoldType);
    });

    it("should map profile fields to positional options", () => {
        const color = "yellow";
        const description = "A pretty good banana";
        const moldType = "none";
        const response = runCliScript(__dirname + "/__scripts__/profiles/map_banana_to_positionals.sh",
            TEST_ENVIRONMENT.workingDir, [color, description, moldType]);
        expect(response.stderr.toString()).toContain("The command 'profiles create' is deprecated.");
        expect(response.status).toBe(0);

        // the output of the command should use the profile values
        expect(response.stdout.toString()).toContain("Color: " + color);
        expect(response.stdout.toString()).toContain("Description: " + description);
        expect(response.stdout.toString()).toContain("Mold type: " + moldType);
    });

    it("should be able to specify valid number type options via environmental variables", () => {
        // values used as env variables
        const cliColor = "yellow and black";
        const cliDescription = "A beautiful bunch of ripe banana hides the deadly black tarantula";
        const cliMoldType = "no mold at all";
        const envSides = "443";
        const response = runCliScript(__dirname + "/__scripts__/profiles/specify_env_for_number.sh",
            TEST_ENVIRONMENT.workingDir, [cliColor, cliDescription, cliMoldType, envSides]);
        expect(response.stderr.toString()).toBe("");
        expect(response.status).toBe(0);

        // the output of the command should use the env variable values
        expect(response.stdout.toString()).toContain("Color: " + cliColor);
        expect(response.stdout.toString()).toContain("Description: " + cliDescription);
        expect(response.stdout.toString()).toContain("Mold type: " + cliMoldType);
        expect(response.stdout.toString()).toContain("Sides: " + envSides);
    });

    it("should get a syntax error when specifying a non-numeric value via environmental variables", () => {
        // values used as env variables
        const cliColor = "yellow and black";
        const cliDescription = "A beautiful bunch of ripe banana hides the deadly black tarantula";
        const cliMoldType = "no mold at all";
        const envSides = "glarbles";
        const response = runCliScript(__dirname + "/__scripts__/profiles/specify_env_for_number.sh",
            TEST_ENVIRONMENT.workingDir, [cliColor, cliDescription, cliMoldType, envSides]);

        expect(response.stderr.toString()).toContain("failed!");
        expect(response.stderr.toString()).toContain("Syntax");
        expect(response.stderr.toString()).toContain("number");
        expect(response.stderr.toString()).toContain(envSides);
        expect(response.status).toBe(1);
    });

    it("should be able to specify valid boolean type options (true) via environmental variables", () => {
        // values used as env variables
        const cliColor = "yellow and black";
        const cliDescription = "A beautiful bunch of ripe banana hides the deadly black tarantula";
        const cliMoldType = "no mold at all";
        const envRipe = "true";
        const response = runCliScript(__dirname + "/__scripts__/profiles/specify_env_for_boolean.sh",
            TEST_ENVIRONMENT.workingDir, [cliColor, cliDescription, cliMoldType, envRipe]);
        expect(response.stderr.toString()).toBe("");
        expect(response.status).toBe(0);

        // the output of the command should use the env variable values
        expect(response.stdout.toString()).toContain("Color: " + cliColor);
        expect(response.stdout.toString()).toContain("Description: " + cliDescription);
        expect(response.stdout.toString()).toContain("Mold type: " + cliMoldType);
        expect(response.stdout.toString()).toContain("Ripe: true");
    });

    it("should be able to specify valid boolean type options (false) via environmental variables", () => {
        // values used as env variables
        const cliColor = "yellow and black";
        const cliDescription = "A beautiful bunch of ripe banana hides the deadly black tarantula";
        const cliMoldType = "no mold at all";
        const envRipe = "false";
        const response = runCliScript(__dirname + "/__scripts__/profiles/specify_env_for_boolean.sh",
            TEST_ENVIRONMENT.workingDir, [cliColor, cliDescription, cliMoldType, envRipe]);
        expect(response.stderr.toString()).toBe("");
        expect(response.status).toBe(0);

        // the output of the command should use the env variable values
        expect(response.stdout.toString()).toContain("Color: " + cliColor);
        expect(response.stdout.toString()).toContain("Description: " + cliDescription);
        expect(response.stdout.toString()).toContain("Mold type: " + cliMoldType);
        expect(response.stdout.toString()).toContain("Ripe: false");
    });

    it("should get a syntax error when specifying a non-boolean value via environmental variables", () => {
        // values used as env variables
        const cliColor = "yellow and black";
        const cliDescription = "A beautiful bunch of ripe banana hides the deadly black tarantula";
        const cliMoldType = "no mold at all";
        const envRipe = "gleebles";
        const response = runCliScript(__dirname + "/__scripts__/profiles/specify_env_for_boolean.sh",
            TEST_ENVIRONMENT.workingDir, [cliColor, cliDescription, cliMoldType, envRipe]);

        expect(response.stderr.toString()).toContain("failed!");
        expect(response.stderr.toString()).toContain("Syntax");
        expect(response.stderr.toString()).toContain("boolean");
        expect(response.stderr.toString()).toContain(envRipe);
        expect(response.status).toBe(1);
    });

    it("should be able to specify valid array type options via environmental variables", () => {
        // values used as env variables
        const cliColor = "yellow and black";
        const cliDescription = "A beautiful bunch of ripe banana hides the deadly black tarantula";
        const cliMoldType = "no mold at all";
        const rawNames = ["bananor", "banane", "neener\\'s non", "bana", "bana\\' nana"];
        const envNames = rawNames.map((name) => {
            return "'" + name + "'";
        }).join(" ");
        const response = runCliScript(__dirname + "/__scripts__/profiles/specify_env_for_array.sh",
            TEST_ENVIRONMENT.workingDir, [cliColor, cliDescription, cliMoldType, envNames]);
        expect(response.stderr.toString()).toBe("");
        expect(response.status).toBe(0);

        // the output of the command should use the env variable values
        expect(response.stdout.toString()).toContain("Color: " + cliColor);
        expect(response.stdout.toString()).toContain("Description: " + cliDescription);
        expect(response.stdout.toString()).toContain("Mold type: " + cliMoldType);
        for (const name of rawNames) {
            expect(response.stdout.toString()).toContain(name.replace("\\'", "'"));
        }
    });

    it("should not map profile fields to --name or --type", () => {
        // values used as env variables
        const color = "yellow";
        const description = "A pretty good banana";
        const moldType = "none";
        const response = runCliScript(__dirname + "/__scripts__/profiles/name_type_undefined.sh",
            TEST_ENVIRONMENT.workingDir, [color, description, moldType]);
        expect(response.stderr.toString()).toContain("The command 'profiles create' is deprecated.");
        expect(response.status).toBe(0);
        // name and type should be undefined since we did not specify them via command line
        expect(response.stdout.toString()).toContain("Name: undefined");
        expect(response.stdout.toString()).toContain("Type: undefined");
    });
    it("should still be able to specify --name and --type on command line", () => {
        // values used as env variables
        const color = "yellow";
        const description = "A pretty good banana";
        const moldType = "none";
        const cliName = "Bonoror";
        const cliType = "Big";
        const response = runCliScript(__dirname + "/__scripts__/profiles/name_type_specify.sh",
            TEST_ENVIRONMENT.workingDir, [color, description, moldType, cliName, cliType]);
        expect(response.stderr.toString()).toContain("The command 'profiles create' is deprecated.");
        expect(response.status).toBe(0);
        // name and type should be undefined since we did not specify them via command line
        expect(response.stdout.toString()).toContain("Name: " + cliName);
        expect(response.stdout.toString()).toContain("Type: " + cliType);
    });
});
