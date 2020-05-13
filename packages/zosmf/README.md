# zOSMF Package
Contains utilities to work with z/OSMF.
# Example
**Create a z/OSMF REST client session from properties in profile, environment, or command line:** 
```
// Load the profile contents
const zosmfProfile = await new BasicProfileManager({
    profileRootDirectory: PROFILE_ROOT_DIR,
    type: "zosmf"
}).load({loadDefault: true});

// Create your session configuration
const sessCfg: ISession =  {
    hostname: commandParameters.arguments.host,
    port: commandParameters.arguments.port,
    rejectUnauthorized: commandParameters.arguments.rejectUnauthorized,
    basePath: commandParameters.arguments.basePath,
    // any other stuff for your session configuration
};

// add credentials to your session configuration
const sessCfgWithCreds = await CredsForSessCfg.addCredsOrPrompt<ISession>(
    sessCfg, commandParameters.arguments
);

// Create the session for the REST client
mySession = new Session(sessCfgWithCreds);
```
