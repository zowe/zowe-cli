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

import { CliUtils, ImperativeConfig, TextUtils } from "../../../utilities";
import { ICommandArguments, IHandlerParameters } from "../../../cmd";
import { ImperativeError } from "../../../error";
import { IOptionsForAddConnProps } from "./doc/IOptionsForAddConnProps";
import { Logger } from "../../../logger";
import * as SessConstants from "./SessConstants";
import { IPromptOptions } from "../../../cmd/src/doc/response/api/handler/IPromptOptions";
import { ISession } from "./doc/ISession";
import { IProfileProperty } from "../../../profiles";
import { ConfigAutoStore } from "../../../config/src/ConfigAutoStore";
import { ConfigUtils } from "../../../config/src/ConfigUtils";
import { AuthOrder, PropUse } from "./AuthOrder";
import { Censor } from "../../../censor/src/Censor";

/**
 * Extend options for IPromptOptions for internal wrapper method
 * @interface IHandlePromptOptions
 * @extends {IPromptOptions}
 */
interface IHandlePromptOptions extends IPromptOptions {

    /**
     * Adds IHandlerParameters to IPromptOptions
     * @type {IHandlerParameters}
     * @memberof IHandlePromptOptions
     */
    parms?: IHandlerParameters;
}

/**
 * This class adds connection information to an existing session configuration
 * object for making REST API calls with the Imperative RestClient.
 */
export class ConnectionPropsForSessCfg {

    // ***********************************************************************
    /**
     * Create a REST session configuration object starting with the supplied
     * initialSessCfg and retrieving connection properties from the command
     * line arguments (or environment, or profile). If required connection
     * properties are missing we interactively prompt the user for the values.
     * for any of the following properties:
     *      host
     *      port
     *      user name
     *      password
     *
     * Any prompt will timeout after 30 seconds so that this function can
     * be run from an automated script, and will not indefinitely hang that
     * script.
     *
     * In addition to properties that we prompt for, we will also add the following
     * properties to the session configuration if they are available.
     *      type
     *      tokenType
     *      tokenValue
     *
     * @param initialSessCfg
     *        An initial session configuration (like ISession, or other
     *        specially defined configuration) that contains your desired
     *        session configuration properties.
     *
     * @param cmdArgs
     *        The arguments specified by the user on the command line
     *        (or in environment, or in profile). The contents of the
     *        supplied cmdArgs will be modified.
     *
     * @param connOpts
     *        Options that alter our connection actions. See IOptionsForAddConnProps.
     *        The connOpts parameter need not be supplied.
     *
     * @example
     *      // Within the process() function of a command handler,
     *      // do steps similar to the following:
     *      const sessCfg: ISession =  {
     *          rejectUnauthorized: commandParameters.arguments.rejectUnauthorized,
     *          basePath: commandParameters.arguments.basePath
     *      };
     *      const connectableSessCfg = await ConnectionPropsForSessCfg.addPropsOrPrompt<ISession>(
     *           sessCfg, commandParameters.arguments
     *      );
     *      mySession = new Session(connectableSessCfg);
     *
     * @returns A session configuration object with connection information
     *          added to the initialSessCfg. Its intended use is for our
     *          caller to create a session for a REST Client.
     */
    public static async addPropsOrPrompt<SessCfgType extends ISession>(
        initialSessCfg: SessCfgType,
        cmdArgs: ICommandArguments,
        connOpts: IOptionsForAddConnProps <SessCfgType> = {}
    ): Promise<SessCfgType> {
        /* Create copies of our initialSessCfg and connOpts so that
         * we can modify them without changing the caller's copy.
         */
        const sessCfgToUse = { ...initialSessCfg };
        const connOptsToUse = { ...connOpts };

        // resolve all values between sessCfg and cmdArgs using option choices
        await ConnectionPropsForSessCfg.resolveSessCfgProps(
            sessCfgToUse, cmdArgs, connOptsToUse
        );

        // This function will provide all the needed properties in one array
        let promptForValues: (keyof SessCfgType & string)[] = [];
        const doNotPromptForValues: (keyof SessCfgType & string)[] = [];

        /* Add the override properties to the session object.
         */
        if (connOpts.propertyOverrides?.length > 0) {
            for (const override of connOpts.propertyOverrides) {
                const argName = override.argumentName ?? override.propertyName;
                // If the override is found on the session or command arguments, start setting things and do not prompt for overridden properties
                if ((sessCfgToUse as any)[override.propertyName] != null || cmdArgs[argName] != null) {
                    // Set the session config to use the command line argument if it exists.
                    if (cmdArgs[argName] != null) { (sessCfgToUse as any)[override.propertyName] = cmdArgs[argName]; }
                    for (const prop of override.propertiesOverridden) {
                        // Make sure we do not prompt for the overridden property.
                        if (!doNotPromptForValues.includes(prop)) { doNotPromptForValues.push(prop); }
                        // remove the property from the session
                        if (prop in sessCfgToUse) { (sessCfgToUse as any)[prop] = undefined; }
                        // remove the property from command arguments
                        if (prop in cmdArgs) { (cmdArgs as any)[prop] = undefined; }
                        // remove the property from the cached creds
                        if (sessCfgToUse._authCache?.availableCreds) {
                            if (prop in sessCfgToUse._authCache.availableCreds) {
                                (sessCfgToUse._authCache.availableCreds as any)[prop] = undefined;
                            }
                        }
                    }
                }
            }
        }
    // resolveSessCfgProps previously added creds to our session, but
    // our caller's overrides may have changed the available creds,
    // so again add the creds that are currently available.
    // Use the async variant because this function is async and callers
    // may expect certificate lookups to complete before continuing.
    await AuthOrder.addCredsToSessionAsync(sessCfgToUse, cmdArgs);

        // Set default values on propsToPromptFor
        if(connOpts.propsToPromptFor?.length > 0) {
            connOpts.propsToPromptFor.forEach(obj => {
                if(obj.secure == null) obj.secure = true;
                if(obj.secure) this.secureSessCfgProps.add(obj.name.toString());
                promptForValues.push(obj.name as keyof ISession);
                this.promptTextForValues[obj.name.toString()] = obj.description;
            });
        }
        // check what properties are needed to be prompted
        if (ConnectionPropsForSessCfg.propHasValue(sessCfgToUse.hostname) === false && !doNotPromptForValues.includes("hostname")) {
            promptForValues.push("hostname");
        }

        if ((ConnectionPropsForSessCfg.propHasValue(sessCfgToUse.port) === false || sessCfgToUse.port === 0) &&
            !doNotPromptForValues.includes("port")) {
            promptForValues.push("port");
        }

        // When no creds were found and the user has not allowed 'none' as a desired auth type,
        // we prompt for the creds associated with the first type in the authOrder.
        if (sessCfgToUse.type === SessConstants.AUTH_TYPE_NONE &&
            !sessCfgToUse.authTypeOrder.includes(SessConstants.AUTH_TYPE_NONE))
        {
            switch (sessCfgToUse.authTypeOrder[0]) {
                case SessConstants.AUTH_TYPE_BASIC:
                    if (!sessCfgToUse._authCache?.availableCreds?.user && !doNotPromptForValues.includes("user")) {
                        promptForValues.push("user");
                    }
                    if (!sessCfgToUse._authCache?.availableCreds?.password && !doNotPromptForValues.includes("password")) {
                        promptForValues.push("password");
                    }
                    break;
                case SessConstants.AUTH_TYPE_TOKEN:
                    if (!sessCfgToUse._authCache?.availableCreds?.tokenType && !doNotPromptForValues.includes("tokenType")) {
                        promptForValues.push("tokenType");
                    }
                    if (!sessCfgToUse._authCache?.availableCreds?.tokenValue && !doNotPromptForValues.includes("tokenValue")) {
                        promptForValues.push("tokenValue");
                    }
                    break;
                case SessConstants.AUTH_TYPE_BEARER:
                    if (!sessCfgToUse._authCache?.availableCreds?.tokenValue && !doNotPromptForValues.includes("tokenValue")) {
                        promptForValues.push("tokenValue");
                    }
                    break;
                case SessConstants.AUTH_TYPE_CERT_PEM:
                    if (!sessCfgToUse._authCache?.availableCreds?.cert && !doNotPromptForValues.includes("cert")) {
                        promptForValues.push("cert");
                    }
                    if (!sessCfgToUse._authCache?.availableCreds?.certKey && !doNotPromptForValues.includes("certKey")) {
                        promptForValues.push("certKey");
                    }
                    break;
            }
        }

        this.loadSecureSessCfgProps(connOptsToUse.parms, promptForValues);

        if (connOptsToUse.getValuesBack == null && connOptsToUse.doPrompting) {
            connOptsToUse.getValuesBack = this.getValuesBack(connOptsToUse);
        }

        if (connOptsToUse.getValuesBack != null) {
            // put all the needed properties in an array and call the external function
            const answers = await connOptsToUse.getValuesBack(promptForValues);

            if(connOpts.propsToPromptFor?.length > 0)
            {
                connOpts.propsToPromptFor.forEach(obj => {
                    if(obj.isGivenValueValid != null)
                    {
                        if(!obj.isGivenValueValid(answers[obj.name])) promptForValues = promptForValues.filter(item => obj.name !== item);
                    }
                });
            }
            // validate what values are given back and move it to sessCfgToUse
            for (const value of promptForValues) {
                if (ConnectionPropsForSessCfg.propHasValue(answers[value])) {
                    (sessCfgToUse as any)[value] = answers[value];
                }
            }

            //
            if (connOptsToUse.autoStore !== false && connOptsToUse.parms != null) {
                await ConfigAutoStore.storeSessCfgProps(connOptsToUse.parms, sessCfgToUse, promptForValues);
            }
        }

    // We previously added creds, but this function may have added more creds
    // after prompting. So, we add available creds again.
    await AuthOrder.addCredsToSessionAsync(sessCfgToUse, cmdArgs);
        return sessCfgToUse;
    }

    // ***********************************************************************
    /**
     * Resolve the overlapping or mutually exclusive properties that can
     * occur. Ensure that the resulting session configuration object contains
     * only the applicable properties. The contents of the supplied sessCfg,
     * cmdArgs, and connOpts will be modified.
     *
     * @param sessCfg
     *      An initial session configuration that contains your desired
     *      session configuration properties.
     *
     * @param cmdArgs
     *      The arguments specified by the user on the command line
     *      (or in environment, or in profile)
     *
     * @param connOpts
     *      Options that alter our actions. See IOptionsForAddConnProps.
     *      The connOpts parameter need not be supplied.
     *      The only option values used by this function are:
     *          connOpts.requestToken
     *          connOpts.defaultTokenType
     *
     * @example
     *      let sessCfg = YouCollectAllProfilePropertiesRelatedToSession();
     *      let cmdArgs = YouSetPropertiesRequiredInCmdArgs();
     *      ConnectionPropsForSessCfg.resolveSessCfgProps(sessCfg, cmdArgs);
     *      sessionToUse = new Session(sessCfg);
     */
    public static async resolveSessCfgProps<SessCfgType extends ISession>(
        sessCfg: SessCfgType,
        cmdArgs: ICommandArguments = { $0: "", _: [] },
        connOpts: IOptionsForAddConnProps <SessCfgType> = {}
    ) {
        // use defaults if caller has not specified these properties.
        if (!Object.prototype.hasOwnProperty.call(connOpts, "requestToken")) {
            connOpts.requestToken = false;
        }
        if (!Object.prototype.hasOwnProperty.call(connOpts, "doPrompting")) {
            connOpts.doPrompting = true;
        }
        if (!Object.prototype.hasOwnProperty.call(connOpts, "defaultTokenType")) {
            connOpts.defaultTokenType = SessConstants.TOKEN_TYPE_JWT;
        }

        if (connOpts.requestToken) {
            // record in the session that we want to request a token.
            AuthOrder.makingRequestForToken(sessCfg);

            // When no token type is specified in the command args or in the session,
            // store our defaultTokenType in the session.
            if (!cmdArgs.tokenType && !sessCfg.tokenType && connOpts.defaultTokenType) {
                sessCfg.tokenType = connOpts.defaultTokenType;
            }
        }

        /* Override properties from our caller's sessCfg
         * with any values from the command line.
         */
        if (ConnectionPropsForSessCfg.propHasValue(cmdArgs.host)) {
            sessCfg.hostname = cmdArgs.host;
        }
        if (ConnectionPropsForSessCfg.propHasValue(cmdArgs.port)) {
            sessCfg.port = cmdArgs.port;
        }
        if (ConnectionPropsForSessCfg.propHasValue(cmdArgs.user)) {
            sessCfg.user = cmdArgs.user;
        }
        if (ConnectionPropsForSessCfg.propHasValue(cmdArgs.password)) {
            sessCfg.password = cmdArgs.password;
        }

        // record all of the currently available credential information into the session
        await AuthOrder.addCredsToSession(sessCfg, cmdArgs);

        // When our caller only supports limited authTypes, limit the authTypes in the session
        if (connOpts.supportedAuthTypes) {
            Logger.getImperativeLogger().warn(`Overriding existing authOrder = ${sessCfg.authTypeOrder} ` +
                `because a service only supports these limited authTypes = ${connOpts.supportedAuthTypes}`
            );
            sessCfg.authTypeOrder = Array.from(connOpts.supportedAuthTypes);

            // ensure that our newly set authOrder will not be overridden in the future
            sessCfg._authCache.didUserSetAuthOrder = true;

            // now that we changed the criteria, ensure that the top creds are recorded in the session
            AuthOrder.putTopAuthInSession(sessCfg);
        }
    }

    // ***********************************************************************
    /**
     * Confirm whether the given session has a credentials.
     *
     * @param sessToTest
     *       the session to be confirmed.
     *
     * @returns true is the session has credentials. false otherwise.
     */
    public static sessHasCreds(sessToTest: ISession) {
        if (sessToTest == null) {
            return false;
        }
        const hasToken = sessToTest.tokenType != null && sessToTest.tokenValue != null;
        const hasCert = sessToTest.certKey != null && sessToTest.cert;
        const hasBasicAuth = sessToTest.base64EncodedAuth != null;
        const hasCreds = sessToTest.user != null && sessToTest.password;
        return hasToken || hasCert || hasBasicAuth || hasCreds;
    }

    /**
     * List of properties on `sessCfg` object that should be kept secret and
     * may not appear in Imperative log files.
     */
    private static readonly secureSessCfgProps: Set<string> = new Set(Censor.SECURE_PROMPT_OPTIONS);

    /**
     * List of prompt messages that is used when the CLI prompts for session
     * config values.
     */
    private static readonly promptTextForValues: { [key: string]: string } = {
        hostname: "Enter the host name of",
        port: "Enter the port number of",
        user: "Enter the user name for",
        password: "Enter the password for"
    };

    /**
     * Prompts the user to input session config values in a CLI environment.
     * This is the default implementation of the `getValuesBack` callback when
     * `connOpts.doPrompting` is true.
     * @param connOpts Options for adding connection properties
     * @returns Name-value pairs of connection properties
     */
    private static getValuesBack<SessCfgType extends ISession=ISession>(connOpts: IOptionsForAddConnProps<SessCfgType>):
    (properties: string[]) => Promise<{ [key: string]: any }> {
        return async (promptForValues: string[]) => {
            /* The check for console.log in the following 'if' statement is only needed for tests
             * which do not create a mock for the connOpts.parms.response.console.log property.
             * In the real world, that property always exists for this CLI-only path of logic.
             */
            if (promptForValues.length > 0 && connOpts.parms?.response.console.log) {
                // We need to prompt for some values. Determine why we need to prompt.
                let reasonForPrompts: string = "";
                if (ImperativeConfig.instance.config?.exists) {
                    reasonForPrompts += "Some required connection properties have not been specified " +
                        "in your Zowe client configuration. ";
                } else if (ConfigUtils.onlyV1ProfilesExist) {
                    reasonForPrompts += "Only V1 profiles exist. V1 profiles are no longer supported. " +
                        "You should convert your V1 profiles to a newer Zowe client configuration. ";
                } else {
                    reasonForPrompts += "No Zowe client configuration exists. ";
                }

                reasonForPrompts += "Therefore, you will be asked for the connection properties " +
                    "that are required to complete your command.\n";
                connOpts.parms.response.console.log(TextUtils.wordWrap(
                    TextUtils.chalk.yellowBright(reasonForPrompts))
                );
            }

            const answers: { [key: string]: any } = {};
            const profileSchema = this.loadSchemaForSessCfgProps(connOpts.parms, promptForValues);
            const serviceDescription = connOpts.serviceDescription || "your service";

            for (const propNm of promptForValues) {
                const sessPropNm = AuthOrder.getPropNmFor(propNm, PropUse.IN_SESS);
                const cfgPropNm = AuthOrder.getPropNmFor(propNm, PropUse.IN_CFG);
                let answer;
                while (answer === undefined) {
                    const hideText = profileSchema[cfgPropNm]?.secure || this.secureSessCfgProps.has(sessPropNm);
                    const valuePrompt = this.promptTextForValues[sessPropNm] ?? `Enter your ${cfgPropNm} for`;
                    let promptText = `${valuePrompt} ${serviceDescription}`;
                    if (hideText) {
                        promptText += " (will be hidden)";
                    }
                    answer = await this.clientPrompt(`${promptText}: `, { hideText, parms: connOpts.parms });
                    if (answer === null) {
                        throw new ImperativeError({ msg: `Timed out waiting for ${cfgPropNm}.` });
                    }
                }
                if (profileSchema[cfgPropNm]?.type === "number") {
                    answer = Number(answer);
                    if (isNaN(answer)) {
                        throw new ImperativeError({ msg: `Specified ${cfgPropNm} was not a number.` });
                    }
                }
                answers[sessPropNm] = answer;
            }

            return answers;
        };
    }

    /**
     * Handle prompting for clients.  If in a CLI environment, use the IHandlerParameters.response
     * object prompt method.
     * @private
     * @static
     * @param {string} promptText
     * @param {IHandlePromptOptions} opts
     * @returns {Promise<string>}
     * @memberof ConnectionPropsForSessCfg
     */
    private static async clientPrompt(promptText: string, opts: IHandlePromptOptions): Promise<string> {
        if (opts.parms) {
            return opts.parms.response.console.prompt(promptText, opts);
        } else {
            return CliUtils.readPrompt(promptText, opts);
        }
    }

    // ***********************************************************************
    /**
     * Confirm whether the specified property has a value.
     *
     * @param propToTest
     *       the property key to be confirmed.
     *
     * @returns true is the property exists and has a value. false otherwise.
     */
    private static propHasValue(propToTest: any) {
        return propToTest != null && propToTest !== "";
    }

    /**
     * Load base profile property schema for connection properties.
     * @param params CLI handler parameters object
     * @param promptForValues List of ISessCfg properties to prompt for
     * @returns Key-value pairs of ISessCfg property name and profile property schema
     */
    private static loadSchemaForSessCfgProps(params: IHandlerParameters | undefined, promptForValues: string[]): { [key: string]: IProfileProperty } {
        if (params == null || ImperativeConfig.instance.loadedConfig?.baseProfile == null) {
            return {};
        }

        const schemas: { [key: string]: IProfileProperty } = {};
        for (const propName of promptForValues) {
            const profilePropName = propName === "hostname" ? "host" : propName;
            schemas[propName] = ImperativeConfig.instance.loadedConfig.baseProfile.schema.properties[profilePropName];
        }
        return schemas;
    }

    /**
     * Load list of secure property names defined in team config.
     * @param params CLI handler parameters object
     * @param promptForValues List of ISessCfg properties to prompt for
     */
    private static loadSecureSessCfgProps(params: IHandlerParameters | undefined, promptForValues: string[]): void {
        if (params == null || !ImperativeConfig.instance.config?.exists) {
            return;
        }

        // Find profile that includes all the properties being prompted for
        const profileProps = promptForValues.map(propName => propName === "hostname" ? "host" : propName);
        const profileData = ConfigAutoStore.findActiveProfile(params, profileProps);
        if (profileData == null) {
            return;
        }

        // Load secure property names that are defined for active profiles
        const config = ImperativeConfig.instance.config;
        const baseProfileName = ConfigUtils.getActiveProfileName("base", params.arguments);
        for (const secureProp of [...config.api.secure.securePropsForProfile(profileData[1]),
            ...config.api.secure.securePropsForProfile(baseProfileName)]) {
            this.secureSessCfgProps.add(secureProp === "host" ? "hostname" : secureProp);
        }
    }
}
