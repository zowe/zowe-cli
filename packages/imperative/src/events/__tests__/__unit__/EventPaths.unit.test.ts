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

import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { EventUtils } from "../../src/EventUtils";
import { EventProcessor } from "../../src/EventProcessor";
import { IProcessorTypes } from "../../src/doc/IEventInstanceTypes";
import { ImperativeConfig } from "../../../utilities/src/ImperativeConfig";
import { ConfigUtils } from "../../../config/src/ConfigUtils";
import { ImperativeError } from "../../../error/src/ImperativeError";
import { Logger } from "../../../logger/src/Logger";

const directoryLink = process.platform === "win32" ? "junction" : "dir";

describe("Event filesystem boundaries", () => {
    let sandbox: string;
    let home: string;
    let previousConfig: typeof ImperativeConfig.instance.loadedConfig;

    beforeEach(() => {
        sandbox = fs.mkdtempSync(path.join(os.tmpdir(), "zowe-event-paths-"));
        home = path.join(sandbox, "home");
        fs.mkdirSync(home);
        previousConfig = ImperativeConfig.instance.loadedConfig;
        ImperativeConfig.instance.loadedConfig = {
            name: "event-path-tests", defaultHome: home, envVariablePrefix: "EVENT_PATH_TESTS"
        };
        jest.spyOn(ConfigUtils, "initImpUtils").mockImplementation(() => undefined);
    });

    afterEach(() => {
        jest.restoreAllMocks();
        ImperativeConfig.instance.loadedConfig = previousConfig;
        fs.rmSync(sandbox, { recursive: true, force: true });
    });

    function processor(): EventProcessor {
        return new EventProcessor("Zowe", IProcessorTypes.BOTH, { debug: jest.fn() } as unknown as Logger);
    }

    it.each(["../victim", "..\\victim", "nested/event", "nested\\event", "/absolute", "C:\\absolute", "", ".", "..", "event\n", "event\0"])(
        "rejects unsafe event name %j before creating the event tree", (name) => {
            expect(() => EventUtils.createEvent(name, "Zowe")).toThrow(ImperativeError);
            expect(fs.readdirSync(home)).toEqual([]);
        }
    );

    it.each(["emitEvent", "subscribeUser", "subscribeShared"] as const)("rejects traversal through %s", (method) => {
        const instance = processor();
        const victim = path.join(home, "victim");
        fs.writeFileSync(victim, "untouched");
        expect(() => instance[method]("../../victim", () => undefined)).toThrow(ImperativeError);
        expect(fs.readFileSync(victim, "utf8")).toBe("untouched");
        expect(instance.subscribedEvents.size).toBe(0);
        expect(fs.existsSync(path.join(home, ".events"))).toBe(false);
    });

    it.each(["../outside", "..\\outside"])("rejects an unsafe allowlisted application %j", (appName) => {
        fs.writeFileSync(path.join(home, "extenders.json"), JSON.stringify({ profileTypes: { [appName]: { from: [appName] } } }));
        expect(() => EventUtils.createEvent("safe-event", appName)).toThrow(ImperativeError);
        expect(() => new EventProcessor(appName, IProcessorTypes.BOTH)).toThrow(ImperativeError);
        expect(fs.existsSync(path.join(home, ".events"))).toBe(false);
        expect(fs.existsSync(path.join(sandbox, "outside"))).toBe(false);
    });

    it.each(["event", "A1_.-", "event..name"])("preserves the event inode and replaces complete JSON on repeated writes to %j", (name) => {
        const event = EventUtils.createEvent(name, "Zowe");
        const inode = fs.statSync(event.eventFilePath).ino;
        event.eventTime = "a long timestamp that will be replaced";
        EventUtils.writeEvent(event);
        event.eventTime = "short";
        EventUtils.writeEvent(event);
        expect(EventUtils.getEventContents(event.eventFilePath)).toEqual(event.toJson());
        expect(fs.statSync(event.eventFilePath).ino).toBe(inode);
        expect(EventUtils.createEvent(name, "Zowe").eventFilePath).toBe(event.eventFilePath);
    });

    it("rejects a sibling-prefix escape and a modified Event file path", () => {
        const event = EventUtils.createEvent("safe-event", "Zowe");
        const outside = path.join(home, ".events-other", "Zowe");
        fs.mkdirSync(outside, { recursive: true });
        const victim = path.join(outside, "safe-event");
        fs.writeFileSync(victim, "untouched");
        event.eventFilePath = victim;
        expect(() => EventUtils.ensureEventsDirExists(outside)).toThrow(ImperativeError);
        expect(() => EventUtils.ensureFileExists(victim)).toThrow(ImperativeError);
        expect(() => EventUtils.writeEvent(event)).toThrow(ImperativeError);
        expect(() => EventUtils.getEventContents(victim)).toThrow(ImperativeError);
        const instance = processor();
        instance.subscribedEvents.set(event.eventName, event);
        expect(() => EventUtils.setupWatcher(instance, event.eventName, () => undefined)).toThrow(ImperativeError);
        expect(event.subscriptions).toEqual([]);
        expect(fs.readFileSync(victim, "utf8")).toBe("untouched");
    });

    it.each(["root", "application"])("rejects a pre-planted %s directory link without touching its destination", (level) => {
        const outside = path.join(sandbox, "outside");
        fs.mkdirSync(outside);
        const victim = path.join(outside, "safe-event");
        fs.writeFileSync(victim, "untouched");
        const root = path.join(home, ".events");
        if (level === "application") fs.mkdirSync(root);
        fs.symlinkSync(outside, level === "root" ? root : path.join(root, "Zowe"), directoryLink);
        expect(() => EventUtils.createEvent("safe-event", "Zowe")).toThrow(ImperativeError);
        expect(fs.readdirSync(outside)).toEqual(["safe-event"]);
        expect(fs.readFileSync(victim, "utf8")).toBe("untouched");
    });

    it("rejects an application directory replaced by a link after subscription", () => {
        const instance = processor();
        const subscription = instance.subscribeUser("safe-event", () => undefined);
        try {
            const appDir = path.join(home, ".events", "Zowe");
            fs.renameSync(appDir, path.join(home, ".events", "original"));
            const outside = path.join(sandbox, "outside");
            fs.mkdirSync(outside);
            const victim = path.join(outside, "safe-event");
            fs.writeFileSync(victim, "untouched");
            fs.symlinkSync(outside, appDir, directoryLink);
            expect(() => instance.emitEvent("safe-event")).toThrow(ImperativeError);
            expect(fs.readFileSync(victim, "utf8")).toBe("untouched");
        } finally {
            subscription.close();
        }
    });

    it("rejects a hard-linked event file without changing the other link", () => {
        const event = EventUtils.createEvent("safe-event", "Zowe");
        const victim = path.join(sandbox, "victim");
        fs.writeFileSync(victim, "untouched");
        fs.unlinkSync(event.eventFilePath);
        fs.linkSync(victim, event.eventFilePath);
        expect(() => EventUtils.ensureFileExists(event.eventFilePath)).toThrow(ImperativeError);
        expect(() => EventUtils.writeEvent(event)).toThrow(ImperativeError);
        expect(() => EventUtils.getEventContents(event.eventFilePath)).toThrow(ImperativeError);
        expect(fs.readFileSync(victim, "utf8")).toBe("untouched");
    });

    it("does not truncate a replacement file when the leaf changes during open", () => {
        const event = EventUtils.createEvent("safe-event", "Zowe");
        const victim = path.join(sandbox, "replacement");
        fs.writeFileSync(victim, "untouched");
        const openSync = fs.openSync;
        jest.spyOn(fs, "openSync").mockImplementationOnce((filePath, flags) => {
            fs.renameSync(event.eventFilePath, path.join(sandbox, "original"));
            fs.renameSync(victim, event.eventFilePath);
            return openSync(filePath, flags);
        });
        expect(() => EventUtils.writeEvent(event)).toThrow(ImperativeError);
        expect(fs.readFileSync(event.eventFilePath, "utf8")).toBe("untouched");
    });

    it("does not write through an opened file when the leaf is replaced right after open", () => {
        const event = EventUtils.createEvent("safe-event", "Zowe");
        const original = path.join(sandbox, "original");
        const replacement = path.join(sandbox, "replacement");
        fs.writeFileSync(replacement, "untouched");
        const openSync = fs.openSync;
        jest.spyOn(fs, "openSync").mockImplementationOnce((filePath, flags) => {
            // The descriptor refers to the original inode, but the path now names the replacement.
            const fd = openSync(filePath, flags);
            fs.renameSync(event.eventFilePath, original);
            fs.renameSync(replacement, event.eventFilePath);
            return fd;
        });
        expect(() => EventUtils.writeEvent(event)).toThrow(/changed while being opened/);
        expect(fs.readFileSync(event.eventFilePath, "utf8")).toBe("untouched");
        expect(fs.readFileSync(original, "utf8")).toBe("");
    });

    // Windows file symlinks require privileges; directory junction coverage above runs on every platform.
    (process.platform === "win32" ? it.skip : it).each(["existing", "dangling"])(
        "rejects an %s symbolic-link event file", (targetState) => {
            const event = EventUtils.createEvent("safe-event", "Zowe");
            const victim = path.join(sandbox, "victim");
            if (targetState === "existing") fs.writeFileSync(victim, "untouched");
            fs.unlinkSync(event.eventFilePath);
            fs.symlinkSync(victim, event.eventFilePath);
            expect(() => EventUtils.ensureFileExists(event.eventFilePath)).toThrow(ImperativeError);
            expect(() => EventUtils.writeEvent(event)).toThrow(ImperativeError);
            expect(() => EventUtils.getEventContents(event.eventFilePath)).toThrow(ImperativeError);
            const instance = processor();
            instance.subscribedEvents.set(event.eventName, event);
            expect(() => EventUtils.setupWatcher(instance, event.eventName, () => undefined)).toThrow(ImperativeError);
            expect(event.subscriptions).toEqual([]);
            if (targetState === "existing") {
                expect(fs.readFileSync(victim, "utf8")).toBe("untouched");
            } else {
                expect(fs.existsSync(victim)).toBe(false);
            }
        }
    );
});
