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

import { CliUtils } from "../../../utilities";
import { ICommandArguments } from "../../../cmd";
import { ImperativeError } from "../../../error";
import { IOptionsForAddConnProps } from "./doc/IOptionsForAddConnProps";
import { Logger } from "../../../logger";
import * as SessConstants from "./SessConstants";

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
     *        (or in environment, or in profile)
     *
     * @param options
     *        Options that alter our actions. See IOptionsForAddConnProps.
     *        The options parameter need not be supplied.
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
    public static async addPropsOrPrompt<T>(
        initialSessCfg: T,
        cmdArgs: ICommandArguments,
        options: IOptionsForAddConnProps = {}
    ): Promise<T> {
        const impLogger = Logger.getImperativeLogger();

        const optionDefaults: IOptionsForAddConnProps = {
            requestToken: false,
            doPrompting: true,
            defaultTokenType: SessConstants.TOKEN_TYPE_JWT
        };

        // override our defaults with what our caller wants.
        const optsToUse = {...optionDefaults, ...options};

        // initialize session config object with what our caller supplied
        const finalSessCfg: any = initialSessCfg;

        const promptForValues = [];

        /* Override properties from our caller's initialSessCfg
         * with any values from the command line.
         */
        if (ConnectionPropsForSessCfg.propHasValue(cmdArgs.host)) {
            finalSessCfg.hostname = cmdArgs.host;
        }
        if (ConnectionPropsForSessCfg.propHasValue(cmdArgs.port)) {
            finalSessCfg.port = cmdArgs.port;
        }
        if (ConnectionPropsForSessCfg.propHasValue(cmdArgs.user)) {
            finalSessCfg.user = cmdArgs.user;
        }
        if (ConnectionPropsForSessCfg.propHasValue(cmdArgs.password)) {
            finalSessCfg.password = cmdArgs.password;
        }

        if (optsToUse.requestToken) {
            // deleting any tokenValue, ensures that basic creds are used to authenticate and get token
            delete finalSessCfg.tokenValue;
        } else if (!ConnectionPropsForSessCfg.propHasValue(finalSessCfg.user) &&
            !ConnectionPropsForSessCfg.propHasValue(finalSessCfg.password) &&
            ConnectionPropsForSessCfg.propHasValue(cmdArgs.tokenValue)) {
            // only set tokenValue if user and password were not supplied
            finalSessCfg.tokenValue = cmdArgs.tokenValue;
        }

        if (!ConnectionPropsForSessCfg.propHasValue(finalSessCfg.user) &&
        !ConnectionPropsForSessCfg.propHasValue(finalSessCfg.password) &&
        !ConnectionPropsForSessCfg.propHasValue(finalSessCfg.tokenValue) &&
        ConnectionPropsForSessCfg.propHasValue(cmdArgs.certFile)) {
            if (ConnectionPropsForSessCfg.propHasValue(cmdArgs.certKeyFile)) {
                finalSessCfg.cert = cmdArgs.certFile;
                finalSessCfg.certKey = cmdArgs.certKeyFile;
            }
            // else if (ConnectionPropsForSessCfg.propHasValue(cmdArgs.certFilePassphrase)) {
            //     finalSessCfg.cert = cmdArgs.certFile;
            //     finalSessCfg.passphrase = cmdArgs.certFilePassphrase;
            // }
        }

        // This function will provide all the needed properties in one array
        if (optsToUse.getValuesBack) {

            // set doPrompting to false if there's a value in getValuesBack
            optionDefaults.doPrompting = false;

            // check what properties are needed to be prompted
            if (ConnectionPropsForSessCfg.propHasValue(finalSessCfg.hostname)=== false) {
                promptForValues.push("hostname");
            }

            if (ConnectionPropsForSessCfg.propHasValue(finalSessCfg.port)=== false) {
                promptForValues.push("port");
            }

            if (ConnectionPropsForSessCfg.propHasValue(finalSessCfg.tokenValue)=== false &&
                ConnectionPropsForSessCfg.propHasValue(finalSessCfg.cert)=== false) {
                if (ConnectionPropsForSessCfg.propHasValue(finalSessCfg.user)=== false) {
                    promptForValues.push("user");
                }

                if (ConnectionPropsForSessCfg.propHasValue(finalSessCfg.password)=== false) {
                    promptForValues.push("password");
                }
            }

            // put all the needed properties in an array and call the external function
            const answer = await optsToUse.getValuesBack(promptForValues);

            // validate what values are given back and move it to finalSessCfg
            if (ConnectionPropsForSessCfg.propHasValue(answer.hostname)) {
                finalSessCfg.hostname = answer.hostname;
            }
            if (ConnectionPropsForSessCfg.propHasValue(answer.port)) {
                finalSessCfg.port = answer.port;
            }
            if (ConnectionPropsForSessCfg.propHasValue(answer.user)) {
                finalSessCfg.user = answer.user;
            }
            if (ConnectionPropsForSessCfg.propHasValue(answer.password)) {
                finalSessCfg.password = answer.password;
            }
        }

        // if our caller permits, prompt for host and port as needed
        if (optsToUse.doPrompting) {
            if (ConnectionPropsForSessCfg.propHasValue(finalSessCfg.hostname) === false) {
                let answer = "";
                while (answer === "") {
                    answer = await CliUtils.promptWithTimeout(
                        "Enter the host name of your service: "
                    );
                    if (answer === null) {
                        throw new ImperativeError({msg: "Timed out waiting for host name."});
                    }
                }
                finalSessCfg.hostname = answer;
            }

            if (ConnectionPropsForSessCfg.propHasValue(finalSessCfg.port) === false) {
                let answer: any;
                while (answer === undefined) {
                    answer = await CliUtils.promptWithTimeout(
                        "Enter the port number for your service: "
                    );
                    console.log(answer);
                    if (answer === null) {
                        throw new ImperativeError({msg: "Timed out waiting for port number."});
                    } else {
                        answer = Number(answer);
                        if (isNaN(answer)) {
                            throw new ImperativeError({msg: "Specified port was not a number."});
                        }
                    }
                }
                finalSessCfg.port = answer;
            }
        }

        /* If tokenValue is set, we have already checked that user and password
         * are not, so it's safe to proceed with using the token.
         */
        if (ConnectionPropsForSessCfg.propHasValue(finalSessCfg.tokenValue) === true)
        {
            impLogger.debug("Using token authentication");
            finalSessCfg.tokenValue = cmdArgs.tokenValue;
            if (ConnectionPropsForSessCfg.propHasValue(cmdArgs.tokenType)) {
                finalSessCfg.type = SessConstants.AUTH_TYPE_TOKEN;
                finalSessCfg.tokenType = cmdArgs.tokenType;
            } else {
                // When no tokenType supplied, user wants bearer
                finalSessCfg.type = SessConstants.AUTH_TYPE_BEARER;
            }
            ConnectionPropsForSessCfg.logSessCfg(finalSessCfg);
            return finalSessCfg;
        }

        if (ConnectionPropsForSessCfg.propHasValue(finalSessCfg.cert) === true) {
            if (ConnectionPropsForSessCfg.propHasValue(finalSessCfg.certKey) === true) {
                impLogger.debug("Using PEM Certificate authentication");
                finalSessCfg.cert = cmdArgs.certFile;
                finalSessCfg.certKey = cmdArgs.certKeyFile;
                finalSessCfg.type = SessConstants.AUTH_TYPE_CERT_PEM;
                ConnectionPropsForSessCfg.logSessCfg(finalSessCfg);
            }
            // else if (ConnectionPropsForSessCfg.propHasValue(finalSessCfg.passphrase) === true) {
            //     impLogger.debug("Using PFX Certificate authentication");
            //     finalSessCfg.cert = cmdArgs.certFile;
            //     finalSessCfg.passphrase = cmdArgs.certFilePassphrase;
            //     finalSessCfg.type = SessConstants.AUTH_TYPE_CERT_PFX;
            //     ConnectionPropsForSessCfg.logSessCfg(finalSessCfg);
            //     return finalSessCfg;
            // }
        }

        /* At this point we ruled out tokens and certificates, so we use user and password. If our
         * caller permits, we prompt for any missing user name and password.
         */
        if (optsToUse.doPrompting) {
            if (ConnectionPropsForSessCfg.propHasValue(finalSessCfg.user) === false &&
                ConnectionPropsForSessCfg.propHasValue(finalSessCfg.cert) === false) {
                let answer = "";
                while (answer === "") {
                    answer = await CliUtils.promptWithTimeout(
                        "Enter user name: "
                    );
                    if (answer === null) {
                        throw new ImperativeError({msg: "Timed out waiting for user name."});
                    }
                }
                finalSessCfg.user = answer;
            }

            if (ConnectionPropsForSessCfg.propHasValue(finalSessCfg.password) === false &&
                ConnectionPropsForSessCfg.propHasValue(finalSessCfg.cert) === false) {
                let answer = "";
                while (answer === "") {
                    answer = await CliUtils.promptWithTimeout(
                        "Enter password : ",
                        true
                    );
                    if (answer === null) {
                        throw new ImperativeError({msg: "Timed out waiting for password."});
                    }
                }
                finalSessCfg.password = answer;
            }
        }

        ConnectionPropsForSessCfg.setTypeForBasicCreds(finalSessCfg, optsToUse, cmdArgs.tokenType);
        ConnectionPropsForSessCfg.logSessCfg(finalSessCfg);
        return finalSessCfg;
    }

    /**
     * List of properties on `sessCfg` object that should be kept secret and
     * may not appear in Imperative log files.
     */
    private static readonly secureSessCfgProps: string[] = ["user", "password", "tokenValue", "passphrase"];

    // ***********************************************************************
    /**
     * Determine if we want to use a basic authentication to acquire a token.
     * Set the session configuration accordingly.
     *
     * @param sessCfg
     *       The session configuration to be updated.
     *
     * @param options
     *       Options that alter our actions. See IOptionsForAddConnProps.
     *
     * @param tokenType
     *       The type of token that we expect to receive.
     */
    private static setTypeForBasicCreds(
        sessCfg: any,
        options: IOptionsForAddConnProps,
        tokenType: SessConstants.TOKEN_TYPE_CHOICES
    ) {
        const impLogger = Logger.getImperativeLogger();
        let logMsgtext;

        if (sessCfg.cert && sessCfg.certKey) {
            logMsgtext = "Using PEM certificate authentication ";
            sessCfg.type = SessConstants.AUTH_TYPE_CERT_PEM;
        // } else if (sessCfg.cert && sessCfg.passphrase) {
        //      logMsgtext = "Using PFX certificate authentication ";
        //      sessCfg.type = SessConstants.AUTH_TYPE_CERT_PFX;
        } else {
            logMsgtext = "Using basic authentication ";
            sessCfg.type = SessConstants.AUTH_TYPE_BASIC;
        }

        if (options.requestToken) {
            // Set our type to token to get a token from user and pass
            logMsgtext += "to get token";
            if (!sessCfg.cert) {
                sessCfg.type = SessConstants.AUTH_TYPE_TOKEN;
            }
            sessCfg.tokenType = tokenType || options.defaultTokenType;
        } else {
            logMsgtext += "with no request for token";
        }
        impLogger.debug(logMsgtext);
    }

    // ***********************************************************************
    /**
     * Log the session configuration that resulted from the addition of
     * credentials. Hide the password.
     *
     * @param sessCfg
     *       The session configuration to be logged.
     */
    private static logSessCfg(sessCfg: any) {
        const impLogger = Logger.getImperativeLogger();

        // create copy of sessCfg and obscure secure fields for displaying in the log
        const sanitizedSessCfg = JSON.parse(JSON.stringify(sessCfg));
        for (const secureProp of ConnectionPropsForSessCfg.secureSessCfgProps) {
            if (sanitizedSessCfg[secureProp] != null) {
                sanitizedSessCfg[secureProp] = `${secureProp}_is_hidden`;
            }
        }
        impLogger.debug("Creating a session config with these properties:\n" +
            JSON.stringify(sanitizedSessCfg, null, 2)
        );
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
    private static propHasValue(propToTest: string) {
        if ((propToTest === undefined || propToTest === null) || ((typeof propToTest) === "string" && propToTest.length === 0)) {
            return false;
        }
        return true;
    }
}
