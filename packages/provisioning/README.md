# Provisioning Package

Contains APIs to interact with the z/OS provisioning APIs

## API Examples

**List z/OSMF Published Catalog Templates**

```typescript
import { ProfileInfo, TextUtils } from "@zowe/core-for-zowe-sdk";
import { explainPublishedTemplatesFull, explainPublishedTemplatesSummary, ListCatalogTemplates,
    ProvisioningConstants } from "@zowe/provisioning-for-zowe-sdk";

(async () => {
    // Load connection info from default z/OSMF profile
    const profInfo = new ProfileInfo("zowe");
    await profInfo.readProfilesFromDisk();
    const zosmfProfAttrs = profInfo.getDefaultProfile("zosmf");
    const zosmfMergedArgs = profInfo.mergeArgsForProfile(zosmfProfAttrs, { getSecureVals: true });
    const session = ProfileInfo.createSession(zosmfMergedArgs.knownArgs);

    const templates = await ListCatalogTemplates.listCatalogCommon(session, ProvisioningConstants.ZOSMF_VERSION);
    let prettifiedTemplates: any = {};
    if (process.argv.slice(2).includes("--all") || process.argv.slice(2).includes("-a")) {
        prettifiedTemplates = TextUtils.explainObject(templates, explainPublishedTemplatesFull, true);
    } else {
        prettifiedTemplates = TextUtils.explainObject(templates, explainPublishedTemplatesSummary, false);
    }
    const response = "z/OSMF Service Catalog templates\n" + TextUtils.prettyJson(prettifiedTemplates);
    console.log(response);
})().catch((err) => {
    console.error(err);
    process.exit(1);
});
```

**Provision a Published Software Service Template**

```typescript
import { ProfileInfo, TextUtils } from "@zowe/core-for-zowe-sdk";
import { ProvisioningConstants, explainProvisionTemplateResponse,
    ProvisionPublishedTemplate } from "@zowe/provisioning-for-zowe-sdk";

(async () => {
    // Load connection info from default z/OSMF profile
    const profInfo = new ProfileInfo("zowe");
    await profInfo.readProfilesFromDisk();
    const zosmfProfAttrs = profInfo.getDefaultProfile("zosmf");
    const zosmfMergedArgs = profInfo.mergeArgsForProfile(zosmfProfAttrs, { getSecureVals: true });
    const session = ProfileInfo.createSession(zosmfMergedArgs.knownArgs);

    const templateName = "myTemplate";
    const response = await ProvisionPublishedTemplate.provisionTemplate(session,
        ProvisioningConstants.ZOSMF_VERSION, templateName);
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
import { ProfileInfo, TextUtils } from "@zowe/core-for-zowe-sdk";
import { explainActionResponse, IProvisionedInstance, ListRegistryInstances, PerformAction,
    ProvisioningConstants } from "@zowe/provisioning-for-zowe-sdk";

(async () => {
    // Load connection info from default z/OSMF profile
    const profInfo = new ProfileInfo("zowe");
    await profInfo.readProfilesFromDisk();
    const zosmfProfAttrs = profInfo.getDefaultProfile("zosmf");
    const zosmfMergedArgs = profInfo.mergeArgsForProfile(zosmfProfAttrs, { getSecureVals: true });
    const session = ProfileInfo.createSession(zosmfMergedArgs.knownArgs);

    const instanceName = "myInstance";
    const actionName = "myAction";
    const registry = await ListRegistryInstances.listFilteredRegistry(session,
        ProvisioningConstants.ZOSMF_VERSION, null, instanceName);
    const instances: IProvisionedInstance[] = registry["scr-list"];
    if (instances == null) {
        console.error("No instance with name " + instanceName + " was found");
    } else if (instances.length === 1) {
        const id = instances.pop()["object-id"];
        const response = await PerformAction.doProvisioningActionCommon(session,
            ProvisioningConstants.ZOSMF_VERSION, id, actionName);
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
