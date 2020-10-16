# Provisioning Package

Contains APIs to interact with the z/OS provisioning APIs

## API Examples

**List z/OSMF Published Catalog Templates**

```typescript
import { IProfile, Session, Logger, LoggingConfigurer, TextUtils, ImperativeError,
         CredentialManagerFactory } from "@zowe/imperative";
import { ZosmfSession } from "@zowe/zosmf-for-zowe-sdk";
import { getDefaultProfile } from "@zowe/core-for-zowe-sdk";
import { explainPublishedTemplatesFull, explainPublishedTemplatesSummary, ListCatalogTemplates,
         IPublishedTemplates, ProvisioningConstants } from "@zowe/provisioning-for-zowe-sdk";

(async () => {
    //Initialize the Imperative Credential Manager Factory and Logger
    Logger.initLogger(LoggingConfigurer.configureLogger('lib', {name: 'test'}));
    // Uncommment the below line if the Secure Credential Store is in use
    // await CredentialManagerFactory.initialize({service: "Zowe-Plugin"});

    // Get the default z/OSMF profile and create a z/OSMF session with it
    let defaultZosmfProfile: IProfile;
    try {
        defaultZosmfProfile = await getDefaultProfile("zosmf", true);
    } catch (err) {
        throw new ImperativeError({msg: "Failed to get a profile."});
    }

    const session: Session = ZosmfSession.createBasicZosmfSession(defaultZosmfProfile);
    const templates: IPublishedTemplates = await ListCatalogTemplates.listCatalogCommon(session, 
        ProvisioningConstants.ZOSMF_VERSION);

    let prettifiedTemplates: any = {};
    if (process.argv.slice(2).includes("--all") || process.argv.slice(2).includes("-a")) {
        prettifiedTemplates = TextUtils.explainObject(templates, explainPublishedTemplatesFull, true);
    } else {
        prettifiedTemplates = TextUtils.explainObject(templates, explainPublishedTemplatesSummary, false);
    }
    let response = "z/OSMF Service Catalog templates\n";
    response = response + TextUtils.prettyJson(prettifiedTemplates);
    console.log(response);
})().catch((err) => {
    console.error(err);
    process.exit(1);
});
```

**Provision a Published Software Service Template**

```typescript
import { IProfile, Session, Logger, LoggingConfigurer, TextUtils, ImperativeError,
         CredentialManagerFactory } from "@zowe/imperative";
import { ZosmfSession } from "@zowe/zosmf-for-zowe-sdk";
import { getDefaultProfile } from "@zowe/core-for-zowe-sdk";
import { ProvisioningConstants, explainProvisionTemplateResponse,
         ProvisionPublishedTemplate, IProvisionTemplateResponse, } from "@zowe/provisioning-for-zowe-sdk";

(async () => {
    //Initialize the Imperative Credential Manager Factory and Logger
    Logger.initLogger(LoggingConfigurer.configureLogger('lib', {name: 'test'}));
    // Uncommment the below line if the Secure Credential Store is in use
    // await CredentialManagerFactory.initialize({service: "Zowe-Plugin"});

    // Get the default z/OSMF profile and create a z/OSMF session with it
    let defaultZosmfProfile: IProfile;
    try {
        defaultZosmfProfile = await getDefaultProfile("zosmf", true);
    } catch (err) {
        throw new ImperativeError({msg: "Failed to get a profile."});
    }

    const session: Session = ZosmfSession.createBasicZosmfSession(defaultZosmfProfile);
    const templateName = "myTemplate";

    const response: IProvisionTemplateResponse = await ProvisionPublishedTemplate.provisionTemplate(session, ProvisioningConstants.ZOSMF_VERSION, templateName;
    let prettyResponse = TextUtils.explainObject(response, explainProvisionTemplateResponse, false);
    prettyResponse = TextUtils.prettyJson(prettyResponse);
    console.log(prettyResponse);
})().catch((err) => {
    console.error(err);
    process.exit(1);
});
```

**List Provisioned Instances and Perform an Action to the Matching Instance**

```typescript
import { IProfile, Session, Logger, LoggingConfigurer, TextUtils, ImperativeError,
         CredentialManagerFactory } from "@zowe/imperative";
import { ZosmfSession } from "@zowe/zosmf-for-zowe-sdk";
import { getDefaultProfile } from "@zowe/core-for-zowe-sdk";
import { explainActionResponse, PerformAction, ListRegistryInstances, IProvisionedInstance,
         ProvisioningConstants } from "@zowe/provisioning-for-zowe-sdk";

(async () => {
    //Initialize the Imperative Credential Manager Factory and Logger
    Logger.initLogger(LoggingConfigurer.configureLogger('lib', {name: 'test'}));
    // Uncommment the below line if the Secure Credential Store is in use
    // await CredentialManagerFactory.initialize({service: "Zowe-Plugin"});

    // Get the default z/OSMF profile and create a z/OSMF session with it
    let defaultZosmfProfile: IProfile;
    try {
        defaultZosmfProfile = await getDefaultProfile("zosmf", true);
    } catch (err) {
        throw new ImperativeError({msg: "Failed to get a profile."});
    }

    const session: Session = ZosmfSession.createBasicZosmfSession(defaultZosmfProfile);
    const templateName = "myTemplate";
    const instanceName = "myInstance";
    const actionName = "myAction";
    const registry = await ListRegistryInstances.listFilteredRegistry(session, ProvisioningConstants.ZOSMF_VERSION, null, instanceName);
    const instances: IProvisionedInstance[] = registry["scr-list"];
    if (instances == null) {
        console.error("No instance with name " + instanceName + " was found");
    } else if (instances.length === 1) {
        const id = instances.pop()["object-id"];
        const response = await PerformAction.doProvisioningActionCommon(session, ProvisioningConstants.ZOSMF_VERSION, id, actionName);
        const pretty = TextUtils.explainObject(response, explainActionResponse, false);
        console.log(TextUtils.prettyJson(pretty));
    } else if (instances.length > 1) {
        console.error("Multiple instances with name " + instanceName + " were found");
    }
})().catch((err) => {
    console.error(err);
    process.exit(1);
});
```
