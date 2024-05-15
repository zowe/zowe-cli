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


// TO DO - flesh out these enums to include all expected user and shared events
/**
 * @internal
 */
export enum ZoweUserEvents {
    ON_VAULT_CHANGED = "onVaultChanged"
}

/**
 * @internal
 */
export enum ZoweSharedEvents {
    ON_CREDENTIAL_MANAGER_CHANGED = "onCredentialManagerChanged"
}

export enum SharedEvents {
    CUSTOM_SHARED_EVENT = "customSharedEvent"
}

export enum UserEvents {
    CUSTOM_USER_EVENT = "customUserEvent",
}

export enum EventTypes { ZoweUserEvents, ZoweSharedEvents, SharedEvents, UserEvents }

export type EventCallback = () => void | PromiseLike<void>;

/**
 * EXPECTED EVENT LOCATIONS:
 *
 * Shared events:
 *   Global:
 *      - $ZOWE_CLI_HOME/.events/onConfigChanged
 *      - $ZOWE_CLI_HOME/.events/onSchemaChanged
 *   Project:
 *      - $ZOWE_CLI_HOME/.events/<project-hash-based-on-path>/onConfigChanged
 *      - $ZOWE_CLI_HOME/.events/<project-hash-based-on-path>/onSchemaChanged
 *
 * User events:
 *   Global:
 *      - ~/.zowe/.events/onUserConfigChanged
 *   Project:
 *      - ~/.zowe/.events/<project-hash-based-on-path>/onUserConfigChanged
 *
 * Custom events:
 *   Shared:
 *     Global:
 *      - $ZOWE_CLI_HOME/.events/<hash-based-on-app-name>/<event-id>
 *     Project:
 *      - $ZOWE_CLI_HOME/.events/<hash-based-on-app-name>/<project-hash-based-on-path>/<event-id>
 *   User:
 *     Global:
 *      - ~/.zowe/.events/<hash-based-on-app-name>/<user-event-id>
 *     Project:
 *      - ~/.zowe/.events/<hash-based-on-app-name>/<project-hash-based-on-path>/<user-event-id>
 */