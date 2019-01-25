# zOSMF Package
Contains utilities to work with z/OSMF.
# Utils Examples
**Create a z/OSMF REST client session From profile:** 
```
// Load the profile contents
const zosmfProfile = await new BasicProfileManager({
    profileRootDirectory: PROFILE_ROOT_DIR,
    type: "zosmf"
}).load({loadDefault: true});

// Create the session for the REST client
const session: Session = utils.createZosmfSession(zosmfProfile);
```
