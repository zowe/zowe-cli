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

const RE_EMIT_INTERVAL_MS = 250;
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

    function subscribe(processor: EventProcessor, eventName: string, type: "shared" | "user" = "shared"): ITestSubscription {
        let notify: () => void;
        const notification = new Promise<void>(resolve => { notify = resolve; });
        const callback = jest.fn(() => notify());
        const disposable = type === "shared" ? processor.subscribeShared(eventName, callback) : processor.subscribeUser(eventName, callback);
        subscriptions.push(disposable);
        return { notification, callback, disposable };
    }

    /**
     * Emit an event until every subscription has been notified.
     *
     * fs.watch gives no readiness signal, and a change made before the watcher is armed is lost for good
     * (notably on macOS, where libuv defers kqueue registration to the next poll and re-arms after each callback).
     * Re-emitting makes delivery independent of that timing. Each emit carries a new eventTime, so the
     * processor's de-duplication treats it as a new event; callers should therefore not assert an exact call count.
     */
    async function emitUntilDelivered(emit: () => void, ...subs: ITestSubscription[]): Promise<void> {
        const delivered = Promise.all(subs.map(sub => sub.notification));
        let isDelivered = false;
        void delivered.then(() => { isDelivered = true; });
        while (!isDelivered) {
            emit();
            let timer: NodeJS.Timeout;
            await Promise.race([delivered, new Promise(resolve => { timer = setTimeout(resolve, RE_EMIT_INTERVAL_MS); })]);
            clearTimeout(timer);
        }
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
            const subscription = subscribe(watcher, sharedZoweEvent);
            const event = watcher.subscribedEvents.get(sharedZoweEvent);
            expect(fs.statSync(event.eventFilePath).isFile()).toBe(true);
            expect(subscription.callback).not.toHaveBeenCalled();

            await emitUntilDelivered(() => EventOperator.getZoweProcessor().emitZoweEvent(sharedZoweEvent), subscription);

            expect(EventUtils.getEventContents(event.eventFilePath).eventName).toBe(sharedZoweEvent);
            expect(subscription.callback).toHaveBeenCalled();
        });

        it("delivers a Zowe event to independent watcher instances", async () => {
            const firstWatcher = new EventProcessor(zoweApp, IProcessorTypes.WATCHER);
            const secondWatcher = new EventProcessor(zoweApp, IProcessorTypes.WATCHER);
            const first = subscribe(firstWatcher, sharedZoweEvent);
            const second = subscribe(secondWatcher, sharedZoweEvent);

            await emitUntilDelivered(() => EventOperator.getZoweProcessor().emitZoweEvent(sharedZoweEvent), first, second);

            expect(first.callback).toHaveBeenCalled();
            expect(second.callback).toHaveBeenCalled();
        });

        it("keeps another instance subscribed when one subscription is closed", async () => {
            const firstWatcher = new EventProcessor(zoweApp, IProcessorTypes.WATCHER);
            const secondWatcher = new EventProcessor(zoweApp, IProcessorTypes.WATCHER);
            const first = subscribe(firstWatcher, sharedZoweEvent);
            const second = subscribe(secondWatcher, sharedZoweEvent);
            second.disposable.close();

            await emitUntilDelivered(() => EventOperator.getZoweProcessor().emitZoweEvent(sharedZoweEvent), first);

            expect(firstWatcher.subscribedEvents.has(sharedZoweEvent)).toBe(true);
            expect(secondWatcher.subscribedEvents.has(sharedZoweEvent)).toBe(false);
            expect(first.callback).toHaveBeenCalled();
            expect(second.callback).not.toHaveBeenCalled();
        });
    });

    describe("Custom Events", () => {
        it("creates and delivers a custom user event in its application directory", async () => {
            const watcher = new EventProcessor(sampleApps[1], IProcessorTypes.WATCHER);
            const subscription = subscribe(watcher, customUserEvent, "user");
            const event = watcher.subscribedEvents.get(customUserEvent);
            expect(event.eventFilePath).toBe(path.join(zoweCliHome, ".events", sampleApps[1], customUserEvent));
            expect(fs.statSync(event.eventFilePath).isFile()).toBe(true);

            await emitUntilDelivered(() => EventOperator.getEmitter(sampleApps[1]).emitEvent(customUserEvent), subscription);

            expect(EventUtils.getEventContents(event.eventFilePath).eventName).toBe(customUserEvent);
            expect(subscription.callback).toHaveBeenCalled();
        });
    });
});
