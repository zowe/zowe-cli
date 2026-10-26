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

import { SetupTestEnvironment } from "../../../../__tests__/__src__/environment/SetupTestEnvironment";
import { ConfigUtils, EventOperator, EventProcessor, EventUtils, IEventDisposable, IProcessorTypes, ZoweSharedEvents } from "../../..";
import * as fs from "fs";
import * as path from "path";
import { IExtendersJsonOpts } from "../../../config/src/doc/IExtenderOpts";

interface ITestSubscription {
    notification: Promise<void>;
    callback: jest.Mock<void, []>;
    disposable: IEventDisposable;
}

const zoweApp = "Zowe";
const sampleApps = ["firstApp", "secondApp"];
let zoweCliHome: string;

/**
 * ## Understanding Event Files
 * |  Zowe Event Dir  | <...>/.zowe/.events/Zowe/<zoweEventName>
 * | Custom Event Dir | <...>/.zowe/.events/custApp/<custEventName>
 *
 * ## Understanding Event Types
 * - **Shared Events**: Zowe events that when triggered, notify all subscribed users.
 * - **User Events**: Zowe events that are specific to a particular user or session.
 * - **Custom Events**: Applications can define their own shared and user events.
*/
describe("Event Operator and Processor", () => {
    const sharedZoweEvent = ZoweSharedEvents.ON_CREDENTIAL_MANAGER_CHANGED;
    const customUserEvent = "onCustomUserEvent";
    let subscriptions: IEventDisposable[] = [];

    async function subscribe(
        processor: EventProcessor,
        eventName: string,
        type: "shared" | "user" = "shared"
    ): Promise<ITestSubscription> {
        let notify: () => void;
        const notification = new Promise<void>(resolve => { notify = resolve; });
        const callback = jest.fn(() => notify());
        const disposable = type === "shared" ? processor.subscribeShared(eventName, callback) : processor.subscribeUser(eventName, callback);
        subscriptions.push(disposable);
        // macOS queues file-watcher registration until the next uv__io_poll entry.
        // Two check-phase turns exit any in-progress poll callback and cross a full poll entry.
        // Source: https://github.com/libuv/libuv/blob/3d09fed7b3c7568391ba5d472da55e3662882c14/src/unix/kqueue.c
        await new Promise<void>(resolve => setImmediate(() => setImmediate(resolve)));
        return { notification, callback, disposable };
    }

    beforeAll(async () => {
        await SetupTestEnvironment.createTestEnv({
            cliHomeEnvVar: "ZOWE_CLI_HOME",
            testName: "event_operator_and_processor"
        });
        // have to reset because test environment doesn't add .zowe to ZOWE_CLI_HOME :(
        process.env.ZOWE_CLI_HOME = path.join(process.env.ZOWE_CLI_HOME || '', ".zowe");
        zoweCliHome = process.env.ZOWE_CLI_HOME;
        fs.mkdirSync(zoweCliHome, { recursive: true, mode: 0o750 });
        const extJson: IExtendersJsonOpts = ConfigUtils.readExtendersJson();
        sampleApps.forEach(app => extJson.profileTypes[app] = { from: [app] });
        ConfigUtils.writeExtendersJson(extJson);
    });

    afterEach(() => {
        subscriptions.forEach(subscription => subscription.close());
        subscriptions = [];
        [zoweApp, ...sampleApps].forEach(app => EventOperator.deleteProcessor(app));
    });

    describe("Zowe Events", () => {
        it("creates an event file on subscription and delivers a Zowe event", async () => {
            const watcher = new EventProcessor(zoweApp, IProcessorTypes.WATCHER);
            const subscription = await subscribe(watcher, sharedZoweEvent);
            const event = watcher.subscribedEvents.get(sharedZoweEvent);
            expect(fs.statSync(event.eventFilePath).isFile()).toBe(true);
            expect(subscription.callback).not.toHaveBeenCalled();

            EventOperator.getZoweProcessor().emitZoweEvent(sharedZoweEvent);
            await subscription.notification;

            expect(EventUtils.getEventContents(event.eventFilePath).eventName).toBe(sharedZoweEvent);
            expect(subscription.callback).toHaveBeenCalledTimes(1);
        });

        it("delivers a Zowe event to independent watcher instances", async () => {
            const firstWatcher = new EventProcessor(zoweApp, IProcessorTypes.WATCHER);
            const secondWatcher = new EventProcessor(zoweApp, IProcessorTypes.WATCHER);
            const first = await subscribe(firstWatcher, sharedZoweEvent);
            const second = await subscribe(secondWatcher, sharedZoweEvent);

            EventOperator.getZoweProcessor().emitZoweEvent(sharedZoweEvent);
            await Promise.all([first.notification, second.notification]);

            expect(first.callback).toHaveBeenCalledTimes(1);
            expect(second.callback).toHaveBeenCalledTimes(1);
        });

        it("keeps another instance subscribed when one subscription is closed", async () => {
            const firstWatcher = new EventProcessor(zoweApp, IProcessorTypes.WATCHER);
            const secondWatcher = new EventProcessor(zoweApp, IProcessorTypes.WATCHER);
            const first = await subscribe(firstWatcher, sharedZoweEvent);
            const second = await subscribe(secondWatcher, sharedZoweEvent);
            second.disposable.close();

            EventOperator.getZoweProcessor().emitZoweEvent(sharedZoweEvent);
            await first.notification;

            expect(firstWatcher.subscribedEvents.has(sharedZoweEvent)).toBe(true);
            expect(secondWatcher.subscribedEvents.has(sharedZoweEvent)).toBe(false);
            expect(first.callback).toHaveBeenCalledTimes(1);
            expect(second.callback).not.toHaveBeenCalled();
        });
    });

    describe("Custom Events", () => {
        it("creates and delivers a custom user event in its application directory", async () => {
            const watcher = new EventProcessor(sampleApps[1], IProcessorTypes.WATCHER);
            const subscription = await subscribe(watcher, customUserEvent, "user");
            const event = watcher.subscribedEvents.get(customUserEvent);
            expect(event.eventFilePath).toBe(path.join(zoweCliHome, ".events", sampleApps[1], customUserEvent));
            expect(fs.statSync(event.eventFilePath).isFile()).toBe(true);

            EventOperator.getEmitter(sampleApps[1]).emitEvent(customUserEvent);
            await subscription.notification;

            expect(EventUtils.getEventContents(event.eventFilePath).eventName).toBe(customUserEvent);
            expect(subscription.callback).toHaveBeenCalledTimes(1);
        });
    });
});
