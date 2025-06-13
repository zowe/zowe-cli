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

import { terminal as term } from "terminal-kit";
import * as fs from "fs";
import * as path from "path";

// Code was adapted/modified with Tabnine pilot :)

// Load schema
const schemaPath = path.join(process.env.HOME || process.env.USERPROFILE || "", ".zowe", "zowe.schema.json");
const schema = JSON.parse(fs.readFileSync(schemaPath, "utf8"));

// Data structures
type ProfileType = "apiML profile" | "dts profile";
type Profile = {
    name: string,
    type: ProfileType,
    profileType?: string,
    properties: any,
    secure?: string[]
};
type Lpar = { name: string, properties: any, profiles: Profile[], secure?: string[] };
type Sysplex = { name: string, properties: any, lpars: Lpar[], secure?: string[] };
const sysplexes: Sysplex[] = [];

// Prep focus state
let sysIdx = 0;
let lparIdx: number | null = null;
let profileIndex: number | null = null;
const showInfo = false;
let showPropertyEdit = false;
let promptActive = false;
let propertyEditIndex = 0;
let propertyValueEditIndex = 0;

// Render the current state of the Zowe Configuration Builder in TUI
//  - display/add/edit sysplexes, LPARs, and profiles
//  - highlight the currently focused element
function render() {
    term.clear();
    term.bold.yellow("Zowe Configuration Builder (arrows to move, a=add, e=edit, p=add/edit property, i=info, q=quit)\n\n");
    if (sysplexes.length === 0) {
        term.gray("No sysplexes. Press 'a' to add one.\n");
        return;
    }
    // Main display of sysplexes, LPARs, and profiles
    sysplexes.forEach((sys, sIdx) => {
        const sysFocus = sysIdx === sIdx && lparIdx === null && profileIndex === null;
        term(sysFocus ? "> " : "  ");
        term.cyan(`Sysplex: ${sys.name || '<empty>'}\n`);
        sys.lpars.forEach((lpar, lIdx) => {
            const lparFocus = sysIdx === sIdx && lparIdx === lIdx && profileIndex === null;
            term(lparFocus ? "  > " : "    ");
            term.green(`LPAR: ${lpar.name || '<empty>'}\n`);
            lpar.profiles.forEach((prof, cIdx) => {
                const profFocus = sysIdx === sIdx && lparIdx === lIdx && profileIndex === cIdx;
                term(profFocus ? "    > " : "      ");
                term.magenta(`${prof.type}: ${prof.name || '<empty>'}\n`);
            });
        });
    });

    // Info panel
    if (showInfo) {
        term("\n");
        let type: string | undefined;
        let target: any = null;
        if (profileIndex !== null && lparIdx !== null) {
            target = sysplexes[sysIdx].lpars[lparIdx].profiles[profileIndex];
            type = target.type;
        } else if (lparIdx !== null) {
            target = sysplexes[sysIdx].lpars[lparIdx];
            type = "lpar";
        } else if (sysplexes[sysIdx]) {
            target = sysplexes[sysIdx];
            type = "sysplex";
        }
        if (type) {
            const allProps = getProfileProperties(type);
            term.bold.underline("Available properties for this level:\n");
            allProps.forEach(p => {
                const isSet = target && Object.prototype.hasOwnProperty.call(target.properties, p.name);
                if (isSet) {
                    term.green(`- ${p.name} (edit)`);
                } else {
                    term.gray(`- ${p.name}`);
                }
                if (p.description) term(`: ${p.description}`);
                term("\n");
            });
        }
    }
    if (showPropertyEdit) {
        let levelName = "";
        if (profileIndex !== null && lparIdx !== null) {
            levelName = sysplexes[sysIdx].lpars[lparIdx].profiles[profileIndex].name;
        } else if (lparIdx !== null) {
            levelName = sysplexes[sysIdx].lpars[lparIdx].name;
        } else if (sysplexes[sysIdx]) {
            levelName = sysplexes[sysIdx].name;
        }
        term.bold.underline(`\nEdit available properties for "${levelName}":\n`);
        let target: any = null;
        let type: string | undefined = undefined;
        if (profileIndex !== null && lparIdx !== null) {
            target = sysplexes[sysIdx].lpars[lparIdx].profiles[profileIndex];
            type = target.profileType || target.type;
        } else if (lparIdx !== null) {
            target = sysplexes[sysIdx].lpars[lparIdx];
            type = "base";
        } else if (sysplexes[sysIdx]) {
            target = sysplexes[sysIdx];
            type = "base";
        }
        if (target && type) {
            const allProps = getProfileProperties(type);
            if (allProps.length === 0) {
                term.red("\nNo editable properties for this level.\n");
                return;
            }
            // Display all properties with current state
            allProps.forEach((p, idx) => {
                const isSet = Object.prototype.hasOwnProperty.call(target.properties, p.name);
                const isSecure = target.secure && target.secure.includes(p.name);
                let label = p.name;
                if (isSet) label += " (edit)";
                if (isSecure) label += " (secure)";
                if (idx === propertyEditIndex) {
                    term.bold.bgYellow.black(`> ${label}\n`);
                } else if (isSet) {
                    term.green(`  ${label}\n`);
                } else {
                    term.gray(`  ${label}\n`);
                }
            });
            term("\nUse UP/DOWN to select, ENTER to edit, 'i' for info, or 'p' again to exit property edit mode.\n");
        }
    }
    term("\n");
}

// Get profile properties based on the profile type
function getProfileProperties(profileType: string): Array<{ name: string, type: string, description?: string, enum?: string[] }> {
    // Find the correct "then" block for the profile type
    const patternProps = schema.properties.profiles.patternProperties["^\\S*$"];
    const allOf = patternProps.allOf || [];
    for (const block of allOf) {
        if (block.if && block.if.properties && block.if.properties.type && block.if.properties.type.const === profileType) {
            const props = block.then.properties.properties.properties;
            // Convert properties to an array of objects with name, type and optional description + enums
            return Object.entries(props).map(([name, def]: [string, any]) => ({
                name,
                type: def.type,
                description: def.description,
                enum: def.enum
            }));
        }
    }
    return [];
}

// Function to get default secure properties for a given profile type
function getDefaultSecureProps(profileType: string): string[] {
    const patternProps = schema.properties.profiles.patternProperties["^\\S*$"];
    const allOf = patternProps.allOf || [];
    // Find the correct "then" block for the profile type in the schema
    for (const block of allOf) {
        if (block.if && block.if.properties && block.if.properties.type && block.if.properties.type.const === profileType) {
            const secureEnum = block.then?.properties?.secure?.items?.enum;
            if (Array.isArray(secureEnum)) return secureEnum;
        }
    }
    return [];
}

// Prompt the user to enter values for specific properties of given profile type
//  - parameter: existing (object containing existing property values)
async function promptAndSetProperties(type: string, existing: any = {}) {
    const fields = getProfileProperties(type);
    const result: any = { ...existing };
    for (const field of fields) {
        term.clear();
        render();
        term.bold(`\nEnter value for ${field.name}`);
        if (field.description) term(`: ${field.description}`);
        term("\n");
        let value: any;
        // Handle booleans and enums
        if (field.enum) {
            const idx = await term.singleColumnMenu(["<skip>", ...field.enum], { cancelable: true }).promise;
            if (idx.selectedIndex === undefined || idx.selectedText === "<skip>") continue;
            value = field.enum[idx.selectedIndex - 1]; // -1 because <skip> is now at index 0
        } else if (field.type === "boolean") {
            const yn = await term.singleColumnMenu(["<skip>", "true", "false"], { cancelable: true }).promise;
            if (yn.selectedIndex === undefined || yn.selectedText === "<skip>") continue;
            value = yn.selectedText === "true";
        } else {
            term("\n"); // Move to a new line before input
            value = await term.inputField({ default: result[field.name] || '', echo: true }).promise;
            if (value === undefined || value === "") continue;
        }
        result[field.name] = value;
    }
    return result;
}

// Main function to run the terminal UI for building Zowe configuration
//  - handles key navigation, adding/editing sysplexes, LPARs, and profiles
//  - allows toggling property editing mode
//  - saves configuration to a test file
export async function runTerminalKitTui() {
    render();
    term.grabInput(true);

    term.on("key", async (name: string) => {
        if (promptActive) return;

        // Navigation
        if (name === "UP") {
            if (profileIndex !== null && profileIndex > 0) {
                profileIndex--;
            } else if (lparIdx !== null && profileIndex === null && lparIdx > 0) {
                lparIdx--;
            } else if (lparIdx === null && profileIndex === null && sysIdx > 0) {
                sysIdx--;
            }
            render();
            return;
        }
        if (name === "DOWN") {
            if (profileIndex !== null && sysplexes[sysIdx].lpars[lparIdx!].profiles.length > profileIndex + 1) {
                profileIndex++;
            } else if (lparIdx !== null && profileIndex === null && sysplexes[sysIdx].lpars.length > lparIdx + 1) {
                lparIdx++;
            } else if (lparIdx === null && profileIndex === null && sysplexes.length > sysIdx + 1) {
                sysIdx++;
            }
            render();
            return;
        }
        if (name === "RIGHT") {
            if (lparIdx === null && sysplexes[sysIdx].lpars.length > 0) {
                lparIdx = 0;
            } else if (lparIdx !== null && profileIndex === null && sysplexes[sysIdx].lpars[lparIdx].profiles.length > 0) {
                profileIndex = 0;
            }
            render();
            return;
        }
        if (name === "LEFT") {
            if (profileIndex !== null) {
                profileIndex = null;
            } else if (lparIdx !== null) {
                lparIdx = null;
            }
            render();
            return;
        }

        // Add
        if (name === "a") {
            term.grabInput(false);
            promptActive = true;
            // At sysplex level (no lpar/prof focus): ask what to add
            if (lparIdx === null && profileIndex === null) {
                const addOptions = ["Add sysplex", "Add LPAR", "Cancel"];
                const addMenu = await term.singleColumnMenu(addOptions, { cancelable: true }).promise;
                if (addMenu.selectedText === "Add sysplex") {
                    await addSysplex();
                } else if (addMenu.selectedText === "Add LPAR" && sysplexes[sysIdx]) {
                    await addLpar(sysIdx);
                }
            } else if (lparIdx !== null && profileIndex === null && sysplexes[sysIdx]?.lpars[lparIdx]) {
                // At LPAR level, add a profile/profile
                await addProfile(sysIdx, lparIdx);
            }
            promptActive = false;
            term.grabInput(true);
            render();
            return;
        }

        // Edit
        if (name === "e") {
            term.grabInput(false);
            promptActive = true;
            if (profileIndex !== null && lparIdx !== null) {
                await editCurrentProfile(sysIdx, lparIdx, profileIndex);
            } else if (lparIdx !== null) {
                await editCurrentLpar(sysIdx, lparIdx);
            } else {
                await editCurrentSysplex(sysIdx);
            }
            promptActive = false;
            term.grabInput(true);
            render();
            return;
        }

        // Toggle Add/Edit Property
        if (name === "p") {
            if (promptActive) return; // Block if another prompt is active
            showPropertyEdit = !showPropertyEdit;
            propertyEditIndex = 0;
            render();
            return;
        }

        // Quit
        if (name === "q" || name === "CTRL_C") {
            term("\nWould you like to save your configuration before quitting?");
            const yn = await term.singleColumnMenu(["yes", "no"], { cancelable: true }).promise;
            if (yn.selectedText === "yes") {
                await saveConfigToTestFile();
                term.green("\nConfiguration saved to .zowe/zowe.test.config.json\n");
            }
            term.clear();
            process.exit();
        }

        // Property selection mode
        if (showPropertyEdit) {
            let target: any = null;
            let type: string | undefined = undefined;
            if (profileIndex !== null && lparIdx !== null) {
                target = sysplexes[sysIdx].lpars[lparIdx].profiles[profileIndex];
                type = target.profileType || target.type;
            } else if (lparIdx !== null) {
                target = sysplexes[sysIdx].lpars[lparIdx];
                type = "base"; //executive decision to treat LPAR level as base profiles
            } else if (sysplexes[sysIdx]) {
                target = sysplexes[sysIdx];
                type = "base"; // executive decision to treat sysplex level as base profiles
            }
            const allProps = getProfileProperties(type);

            if (name === "UP") {
                propertyEditIndex = (propertyEditIndex + allProps.length - 1) % allProps.length;
                render();
                return;
            }
            if (name === "DOWN") {
                propertyEditIndex = (propertyEditIndex + 1) % allProps.length;
                render();
                return;
            }
            if (name === "i") {
                term.clear();
                render();
                const prop = allProps[propertyEditIndex];
                term.bold(`\nInfo for property "${prop.name}":\n`);
                term(`${prop.description || "No description."}\n`);
                term("\nPress any key to return...");
                await term.inputField().promise;
                render();
                return;
            }
            if (name === "ENTER") {
                propertyValueEditIndex = propertyEditIndex;
                await propertyValueEditLoop(target, allProps, propertyValueEditIndex);
                term.clear();
                render();
                return;
            }
        }
    });
}

// Add a new sysplex, prompting for name and properties
async function addSysplex() {
    term.clear();
    render();
    term("\nSysplex name: ");
    const name = await term.inputField({ echo: true }).promise;
    if (!name) return;

    let properties: any = {};
    term("\nWould you like to add properties for this sysplex? ");
    const yn = await term.singleColumnMenu(["yes", "no"], { cancelable: true }).promise;
    if (yn.selectedText === "yes") {
        properties = await promptAndSetProperties("base");
    }
    // Add the new sysplex to the list
    sysplexes.push({ name, properties, lpars: [] });
}

// Add a new LPAR to the currently focused sysplex
async function addLpar(sysIdx: number) {
    term.clear();
    render();
    term("\nLPAR name: ");
    const name = await term.inputField({ echo: true }).promise;
    if (!name) return;

    let properties: any = {};
    term("\nWould you like to add properties for this LPAR? ");
    const yn = await term.singleColumnMenu(["yes", "no"], { cancelable: true }).promise;
    if (yn.selectedText === "yes") {
        properties = await promptAndSetProperties("base");
    }
    sysplexes[sysIdx].lpars.push({ name, properties, profiles: [] });
}

// Add a new profile to the currently focused LPAR
async function addProfile(sysIdx: number, lparIdx: number) {
    term.clear();
    render();
    term("\nSelect profile type to add:");
    const profileTpes: ProfileType[] = ["apiML profile", "dts profile"];
    const typeIdx = await term.singleColumnMenu(profileTpes, { cancelable: true }).promise;
    if (typeIdx.selectedIndex === undefined) return;
    const type = profileTpes[typeIdx.selectedIndex];

    term.clear();
    render();
    term(`${type} name: `);
    const name = await term.inputField({ echo: true }).promise;
    if (!name) return;

    term.clear();
    render();
    term("\nSelect base profile type for this profile:");
    const schemaTypes = ["zosmf", "tso", "ssh", "base"];
    const baseTypeIdx = await term.singleColumnMenu(schemaTypes, { cancelable: true }).promise;
    if (baseTypeIdx.selectedIndex === undefined) return;
    const profileType = schemaTypes[baseTypeIdx.selectedIndex];

    const properties = await promptAndSetProperties(profileType);

    sysplexes[sysIdx].lpars[lparIdx].profiles.push({
        name,
        type,
        profileType,
        properties,
        secure: getDefaultSecureProps(profileType)
    });
}

// Edit the currently focused sysplex, LPAR, or profile
async function editCurrentSysplex(sysIdx: number) {
    const sys = sysplexes[sysIdx];
    term(`\nEdit Sysplex name (${sys.name}): `);
    const name = await term.inputField({ default: sys.name, echo: true }).promise;
    if (name !== undefined && name !== "") sys.name = name;
    // Optionally prompt for sysplex-level properties from schema if needed
}

// Edit the currently focused LPAR
async function editCurrentLpar(sysIdx: number, lparIdx: number) {
    const lpar = sysplexes[sysIdx].lpars[lparIdx];
    term(`\nEdit LPAR name (${lpar.name}): `);
    const name = await term.inputField({ default: lpar.name, echo: true }).promise;
    if (name !== undefined && name !== "") lpar.name = name;
    const properties = await promptAndSetProperties("lpar", lpar.properties);
    if (properties) lpar.properties = properties;
}

// Edit the currently focused profile
async function editCurrentProfile(sysIdx: number, lparIdx: number, profileIndex: number) {
    const prof = sysplexes[sysIdx].lpars[lparIdx].profiles[profileIndex];
    term(`\nEdit ${prof.type} name (${prof.name}): `);
    const name = await term.inputField({ default: prof.name, echo: true }).promise;
    if (name !== undefined && name !== "") prof.name = name;
    // Use the schema to prompt for all properties for this profile type
    const properties = await promptAndSetProperties(prof.type, prof.properties);
    if (properties) prof.properties = properties;
}

// Save the current configuration to a test file (to be changed later)
async function saveConfigToTestFile() {
    const home = process.env.HOME || process.env.USERPROFILE || "";
    const zoweDir = path.join(home, ".zowe");
    const outPath = path.join(zoweDir, "zowe.test.config.json");

    // Build config object in the same structure as your current zowe.config.json
    const config: any = {
        "$schema": "./zowe.schema.json",
        "profiles": {},
        "defaults": {},
        "autoStore": true
    };

    // Convert your in-memory sysplexes/LPARs/profiles to profiles
    for (const sysplex of sysplexes) {
        config.profiles[sysplex.name] = {
            type: "base",
            properties: sysplex.properties || {},
            secure: sysplex.secure || [],
            lpars: sysplex.lpars?.map(lpar => ({
                name: lpar.name,
                properties: lpar.properties || {},
                secure: lpar.secure || [],
                profiles: lpar.profiles?.map(prof => ({
                    name: prof.name,
                    type: prof.profileType || prof.type,
                    properties: prof.properties || {},
                    secure: prof.secure || []
                })) || []
            })) || []
        };
    }

    // Optionally, set defaults and autoStore as needed
    // config.defaults = { ... };
    // config.autoStore = true;

    // Ensure .zowe directory exists
    if (!fs.existsSync(zoweDir)) {
        fs.mkdirSync(zoweDir, { recursive: true });
    }
    fs.writeFileSync(outPath, JSON.stringify(config, null, 4), "utf8");
}

// Loop to edit property values for a specific target (sysplex, LPAR, or profile)
async function propertyValueEditLoop(target: any, allProps: any[], startIdx: number) {
    let idx = startIdx;
    let done = false;
    while (!done) {
        // Only redraw after a key event
        term.clear();
        const levelName = target.name || "";
        term.bold.underline(`\nEdit values for "${levelName}":\n\n`);
        allProps.forEach((p, i) => {
            const isSet = Object.prototype.hasOwnProperty.call(target.properties, p.name);
            const isSecure = target.secure && target.secure.includes(p.name);
            let label = p.name;
            if (isSet) label += " (edit)";
            if (isSecure) label += " (secure)";
            label += isSet ? ` : ${JSON.stringify(target.properties[p.name])}` : "";
            if (i === idx) {
                term.bold.bgGray.white(`> ${label}\n`);
            } else if (isSet) {
                term.green(`  ${label}\n`);
            } else {
                term.dim.gray(`  ${label}\n`);
            }
        });
        term("\nUse UP/DOWN to select, ENTER to edit value/secure, ESC to return.\n");

        // Wait for key
        const key = await new Promise<string>(resolve => {
            term.once('key', resolve);
        });

        if (key === "UP") {
            idx = (idx + allProps.length - 1) % allProps.length;
        } else if (key === "DOWN") {
            idx = (idx + 1) % allProps.length;
        } else if (key === "ESCAPE") {
            done = true;
            term.clear();
        } else if (key === "ENTER") {
            promptActive = true;
            await editPropertyValue(target, allProps[idx]);
            promptActive = false;
            // No need to clear here; the next loop iteration will redraw
        }
    }
}

// Edit a property value, with handling for enum/boolean and text input
async function editPropertyValue(target: any, prop: any) {
    term.clear();
    term.bold.underline(`\nEdit value for "${prop.name}"\n`);
    if (prop.description) term(`${prop.description}\n`);
    const currentValue = target.properties[prop.name];

    if (prop.enum) {
        // Enum/boolean: show scrollable menu with confirm/cancel
        let options = [...prop.enum];
        let selectedIdx = prop.enum.indexOf(currentValue);
        if (selectedIdx === -1) selectedIdx = 0;
        while (true) {
            term.clear();
            term.bold.underline(`\nEdit value for "${prop.name}"\n`);
            if (prop.description) term(`${prop.description}\n`);
            term("\nSelect new value:\n");
            const menu = await term.singleColumnMenu(
                [...options, "Confirm changes", "Cancel"],
                { selectedIndex: selectedIdx, cancelable: true }
            ).promise;
            if (menu.selectedText === "Cancel" || menu.canceled) return;
            if (menu.selectedText === "Confirm changes") {
                target.properties[prop.name] = options[selectedIdx];
                break;
            }
            selectedIdx = menu.selectedIndex;
        }
    } else {
        // Text/number: show input field on its own, then confirm/cancel menu
        while (true) {
            term.clear();
            term.bold.underline(`\nEdit value for "${prop.name}"\n`);
            if (prop.description) term(`${prop.description}\n`);
            term(`\nCurrent value: `);
            if (currentValue !== undefined && currentValue !== "") {
                term.cyan(`${JSON.stringify(currentValue)}\n`);
            } else {
                term.gray("<unset>\n");
            }
            term("New value: ");
            const value = await term.inputField({ default: currentValue ?? "", echo: true }).promise;

            // If user pressed ESC or Ctrl+C, cancel
            if (value === undefined) return;

            // Show confirm/cancel menu right after input, without clearing again
            term("\n");
            const menu = await term.singleColumnMenu(
                [
                    "Confirm",
                    "Cancel"
                ],
                { cancelable: true, selectedIndex: 0 }
            ).promise;

            if (menu.selectedText === "Cancel" || menu.canceled) return;
            if (menu.selectedText === "Confirm") {
                // If value is empty string, delete the property
                if (value === "") {
                    delete target.properties[prop.name];
                } else {
                    target.properties[prop.name] = value;
                }
                break;
            }
        }
    }
}