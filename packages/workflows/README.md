# z/OS Workflows Package

Contains APIs and commands to work with the z/OS Workflows APIs

## API Examples

**List Active Workflow Instance(s) in z/OSMF**

```javascript
import { ISession, Session, Logger, LoggingConfigurer, TextUtils, CommandResponse } from "@zowe/imperative";
import { ListWorkflows } from "@zowe/zos-workflows-for-zowe-sdk";

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

// See https://github.com/zowe/zowe-cli/issues/762 for a full list of things to fix
// Some of these fields are not optional in listWorkflows API
const workflowName: string = null;
const category: string = null;
const system: string = null;
const owner: string = null;
const vendor: string = null;
const statusName: string = null;

(async () => {
    // TODO: export IActiveWorkflows
    let response: any;//IActiveWorkflows;
    let error;
    try {
        // TODO: API not really usable if you don't specify a few "Optional" fields
        response = await ListWorkflows.listWorkflows(session);
    } catch (err) {
        error = "List workflow(s) " + err;
        throw error;
    }

    const width = 42;
    // TODO: export IWorkflowsInfo
    response.workflows.forEach((workflow: any/*IWorkflowsInfo*/) => {
        workflow.workflowName = TextUtils.wordWrap(`${workflow.workflowName}`, width);
        workflow.workflowKey = TextUtils.wordWrap(`${workflow.workflowKey}`, width);
        workflow.workflowDescription = TextUtils.wordWrap(`${workflow.workflowDescription}`, width);
    });

    // Format & print the response
    if (response.workflows.length) {
        new CommandResponse().format.output({
            fields: ["workflowName", "workflowKey", "workflowDescription"],
            output: response.workflows,
            format: "table",
            header: true
        });
    } else {
        // TODO: fix typo
        console.log("No workflows match the requested querry");
    }
})();
```
