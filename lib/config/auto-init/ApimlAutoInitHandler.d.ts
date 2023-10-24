import { BaseAutoInitHandler, AbstractSession, ICommandArguments, IConfig, ISession, IHandlerResponseApi, IHandlerParameters } from "@zowe/imperative";
/**
 * This class is used by the auth command handlers as the base class for their implementation.
 */
export default class ApimlAutoInitHandler extends BaseAutoInitHandler {
    /**
     * The profile type where token type and value should be stored
     */
    protected mProfileType: string;
    /**
     * The description of your service to be used in CLI prompt messages
     */
    protected mServiceDescription: string;
    private readonly NO_CHANGES_MSG;
    private readonly CREATED_MSG;
    private readonly MODIFIED_MSG;
    private readonly REMOVED_MSG;
    private readonly WARNING_MSG;
    /**
     * This structure is populated during convertApimlProfileInfoToProfileConfig
     * and retrieved by the auto-init command handler to provide the data for the
     * output of the auto-init command.
     * @private
     */
    private mAutoInitReport;
    /**
     * This is called by the {@link BaseAuthHandler#process} when it needs a
     * session. Should be used to create a session to connect to the auto-init
     * service.
     * @param {ICommandArguments} args The command line arguments to use for building the session
     * @returns {ISession} The session object built from the command line arguments.
     */
    protected createSessCfgFromArgs: (args: ICommandArguments) => ISession;
    /**
     * This is called by the "auto-init" command after it creates a session, to generate a configuration
     * @param {AbstractSession} session The session object to use to connect to the configuration service
     * @returns {Promise<string>} The response from the auth service containing a token
     * @throws {ImperativeError}
     */
    protected doAutoInit(session: AbstractSession, params: IHandlerParameters): Promise<IConfig>;
    /**
     * This is called by our processAutoInit() base class function to display the set of actions
     * taken by the auto-init command.
     */
    protected displayAutoInitChanges(response: IHandlerResponseApi): void;
    /**
     * Colorize a change keyword for a message to be displayed.
     *
     * @param {string} changeKeyWd
     *        The keyword that we want to colorize.
     *
     * @returns {string} A string with the keyword in the appropriate color.
     */
    private colorizeKeyword;
    /**
     * Record the set of profiles found by our interrogation of plugins and APIML.
     * The information is re-arranged to enable easy reporting of the desired information.
     * This function assumes that the 'services' module continues to use its algorithm
     * in which the first profile of a given type is the profile that we select..
     * If that changes, this function must also change.
     *
     * @param {IApimlProfileInfo} apimlProfInfos
     *        The profileInfo array returned by services.getServicesByConfig().
     */
    private recordProfilesFound;
    /**
     * Record how the profiles have been updated by auto-init.
     */
    private recordProfileUpdates;
    /**
     * Record the change message for one profile with the
     * this.mAutoInitReport.profileRpts array.
     *
     * @param {string} profNmToRecord
     *        The name of the profile for which we want to record a change.
     *
     * @param {IConfigProfile} profObj
     *        An IConfigProfile object which is used when a new entry must be
     *        created in the profileRpts array.
     *
     * @param {string} msgToRecord
     *        The message to record for the type of change to this profile.
     */
    private recordOneProfChange;
    /**
     * Record info about profile properties that override properties defined in
     * the base profile. These properties may prevent connecting to the APIML.
     */
    private recordProfileConflictsWithBase;
}
