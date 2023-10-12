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

/**
 * Imperative constants
 * @export
 * @class Constants
 */
export class Constants {
    public static readonly FRAMEWORK_DISPLAY_NAME: string = "Imperative";
    public static readonly IMPERATIVE_DEFAULT_HOME: string = "IMPERATIVE_HOME";
    public static readonly IMPERATIVE_DIRECTORY: string = ".imperative";

    public static readonly ERROR_EXIT_CODE: number = 1;

    public static readonly PRIMARY_COMMAND: string = "imperative";

    public static readonly PROFILES_DIR: string = "/profiles";

    /**
     * Syntax diagram
     */
    public static readonly COMMAND_SEGMENT: string = "[command]";
    public static readonly GROUP_SEGMENT: string = "[group]";
    public static readonly OPTIONS_SEGMENT: string = "[options]";

    /**
     * Explanation of experimental features to be used in various places around the CLI
     * @type {string}
     */
    public static readonly DEFAULT_EXPERIMENTAL_COMMAND_EXPLANATION: string =
    "Experimental commands are commands that are not ready for general availability. If you " +
        "decide to use these commands, you might encounter bugs, incompatibilities with your system, " +
        "or incomplete help text. ";
    /**
     * Segments
     */
    public static readonly PRIMARY_SEGMENT_NUMBER: number = 1;
    public static readonly GROUP_SEGMENT_NUMBER: number = 2;

    public static readonly DEFAULT_SET_PROFILE_OBJECT = "default-profiles";
    public static readonly DEFAULT_SET_PROFILE_OBJECT_ALIAS = "dbp";
    public static readonly DEFAULT_SET_GROUP = "set";

    public static readonly DEFAULT_LIST_PROFILE_OBJECT = "loaded-profiles";
    public static readonly DEFAULT_LIST_PROFILE_OBJECT_ALIAS = "lbp";
    public static readonly DEFAULT_LIST_GROUP = "list";

    public static GLOBAL_GROUP = "Global options";
    public static readonly JSON_OPTION = "response-format-json";
    public static readonly JSON_OPTION_ALIAS = "rfj";
    public static readonly HELP_OPTION = "help";
    public static readonly HELP_OPTION_ALIAS = "h";
    public static readonly HELP_EXAMPLES = "help-examples";
    public static readonly HELP_WEB_OPTION = "help-web";
    public static readonly HELP_WEB_OPTION_ALIAS = "hw";

    public static readonly STDIN_OPTION = "stdin";
    public static readonly STDIN_OPTION_ALIAS = "pipe";
    public static readonly STDIN_DEFAULT_DESCRIPTION = "Pipe data into this command via stdin";

    public static readonly OPT_LONG_DASH = "--";
    public static readonly OPT_SHORT_DASH = "-";

    /**
     * If you use the stdin option, you will be able to access the contents buffer
     * through this key on your Arguments object in your command
     * @type {string}
     */
    public static readonly STDIN_CONTENT_KEY: string = "stdin-content";

    /**
     * Create profile constants
     */
    public static readonly CREATE_ACTION = "create";
    public static readonly PROFILE_GROUP = "profiles";
    public static readonly PROFILE_OBJECT = "profile";
    public static readonly PROFILE_ALIASES: string[] = ["profile", "pr"];
    public static readonly PROFILE_NAME_OPTION = "profileName";
    public static readonly PROFILE_NAME_OPTION_ALIAS = "pn";
    public static readonly OVERWRITE_OPTION = "overwrite";
    public static readonly DISABLE_DEFAULTS_OPTION = "disable-defaults";
    public static readonly DELETE_ACTION = "delete";
    public static readonly DETAILS_ACTION = "detail";
    public static readonly SHOW_DEPS_ACTION = "show-dependencies";
    public static readonly VALIDATE_ACTION = "validate";
    public static readonly UPDATE_ACTION = "update";
    public static readonly LIST_ACTION = "list";
    public static readonly PROFILE_SET_OPTION_ALIAS = `{{typeLetter}}n`;
    public static readonly SET_ACTION = "set-default";
    public static readonly PROFILE_DELETE_PROFILE_DEPS = "delete-dependent-profiles";
    public static readonly PROFILE_DELETE_PROFILE_DEPS_ALIAS = "ddp";

    public static readonly DEFAULT_HIGHLIGHT_COLOR = "yellow";
    public static readonly DEFAULT_PROMPT_PHRASE = "PROMPT*";

    public static readonly WEB_HELP_DIR = "web-help";

    /**
     * Auth group constants
     */
    public static readonly AUTH_GROUP = "auth";
    public static readonly LOGIN_ACTION = "login";
    public static readonly LOGIN_ACTION_ALIAS = "li";
    public static readonly LOGOUT_ACTION = "logout";
    public static readonly LOGOUT_ACTION_ALIAS = "lo";
}
