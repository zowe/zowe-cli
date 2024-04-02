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

export enum ImperativeUserEvents {
    ON_VAULT_CHANGED = "onVaultChanged"
}
export enum ImperativeSharedEvents {
    ON_CREDENTIAL_MANAGER_CHANGED = "onCredentialManagerChanged"
}

export type ImperativeEventType = ImperativeUserEvents | ImperativeSharedEvents;

// export const ImperativeUserEvents = [
//     "onVaultChanged"
// ] as const;
// export type ImperativeUserEventType = typeof ImperativeUserEvents;
// export const ImperativeSharedEvents = [
//     "onCredentialManagerChanged"
// ] as const;
// export type ImperativeSharedEventType = typeof ImperativeSharedEvents[number];
// export type ImperativeEventType = ImperativeUserEventType | ImperativeSharedEventType;

/**
 * TODO:
 * - Implement onGlobalConfigChanged as a shared event
 * - Implement project-level config-changed as a shared event
 *     - These events should have their own directory structure to support multiple projects
 *     - $ZOWE_CLI_HOME/.zowe/.events/project-id/onConfigChanged
 * - Implement onGlobalSchemaChanged as a shared event
 * - Implement project-level schema-changed as a shared event
 *     - These events should have their own directory structure to support multiple projects
 *     - $ZOWE_CLI_HOME/.zowe/.events/project-id/onSchemaChanged
 *
 *
 * - Implement CustomSharedEvents
 *     - These events should have their own directory structure to avoid conflicts between apps
 *     - $ZOWE_CLI_HOME/.zowe/.events/<app-name>/<custom-shared-event-id>
 * - Implement CustomUserEvents
 *     - These events should have their own directory structure to avoid conflicts between apps
 *     - ~/.zowe/.events/<app-name>/<custom-user-event-id>
 *
 *
 * Edge cases:
 * - What if the `path/to/.events` directory gets renamed or moved? (fs.watch stops notifying apps)
 *      - (amber) I think this is something we should just let people know about. ie warn them NOT to mess w .zowe/events
 */