# Provisioning Package

Contains APIs and commands to work with the provisioning APIs

## API Examples

**List z/OSMF Published Catalog Templates**

```javascript
import { ISession, Session, Logger, LoggingConfigurer, TextUtils } from "@zowe/imperative";
import {
  explainPublishedTemplatesFull,
  explainPublishedTemplatesSummary,
  ListCatalogTemplates,
  IPublishedTemplates,
  ProvisioningConstants
} from "@zowe/provisioning-for-zowe-sdk";

Logger.initLogger(LoggingConfigurer.configureLogger('lib', {name: 'test'}));

const conn: ISession = {
    hostname: "somehost.net",
    port: 443,
    rejectUnauthorized: false,
    user: "ibmuser",
    password: "password",
    type: "basic",
};
const session = new Session(conn);

(async () => {
    const templates: IPublishedTemplates = await ListCatalogTemplates.listCatalogCommon(session, ProvisioningConstants.ZOSMF_VERSION);
    let prettifiedTemplates: any = {};
    if (process.argv.slice(2).contains("--all") || process.argv.slice(2).contains("-a")) {
        prettifiedTemplates = TextUtils.explainObject(templates, explainPublishedTemplatesFull, true);
    } else {
        prettifiedTemplates = TextUtils.explainObject(templates, explainPublishedTemplatesSummary, false);
    }
    let response = "z/OSMF Service Catalog templates\n";
    response = response + TextUtils.prettyJson(prettifiedTemplates);
    console.log(response);
})();
```

**Provision a Published Software Service Template**

```javascript
import { ISession, Session, Logger, LoggingConfigurer, TextUtils } from "@zowe/imperative";
import {
    explainProvisionTemplateResponse,
    ProvisionPublishedTemplate,
    IPublishedTemplates,
    ProvisioningConstants
} from "@zowe/provisioning-for-zowe-sdk";

Logger.initLogger(LoggingConfigurer.configureLogger('lib', {name: 'test'}));

const conn: ISession = {
    hostname: "somehost.net",
    port: 443,
    rejectUnauthorized: false,
    user: "ibmuser",
    password: "password",
    type: "basic",
};
const session = new Session(conn);
const templateName = "myTemplate";

(async () => {
    const response: IPublishedTemplates = await ProvisionPublishedTemplate.provisionTemplate(session, ProvisioningConstants.ZOSMF_VERSION, templateName);
    let prettyResponse = TextUtils.explainObject(response, explainProvisionTemplateResponse, false);
    prettyResponse = TextUtils.prettyJson(prettyResponse);
    console.log(prettyResponse);
})();
```

**List Provisioned Instances and Perform an Action to the Matching Instance**

```javascript
import { ISession, Session, Logger, LoggingConfigurer, TextUtils } from "@zowe/imperative";
import {
    explainActionResponse,
    PerformAction,
    ListRegistryInstances,
    IProvisionedInstance,
    ProvisioningConstants
} from "@zowe/provisioning-for-zowe-sdk";

Logger.initLogger(LoggingConfigurer.configureLogger('lib', {name: 'test'}));

const conn: ISession = {
    hostname: "somehost.net",
    port: 443,
    rejectUnauthorized: false,
    user: "ibmuser",
    password: "password",
    type: "basic",
};
const session = new Session(conn);
const instanceName = "myInstance";
const actionName = "myAction";

(async () => {
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
})();
```
