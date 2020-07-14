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

(async () => {
    // TODO: export IActiveWorkflows
    let response: any;//IActiveWorkflows;
    let error;
    try {
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
        console.log("No workflows match the requested query");
    }
})();
```
