# z/OS Workflows Package

Contains APIs and commands to work with the z/OS Workflows APIs

## API Examples

**List Active Workflow Instance(s) in z/OSMF**

```javascript
import { ISession, Session, Logger, LoggingConfigurer } from "@zowe/imperative";
import { IActiveWorkflows, ListWorkflows } from "@zowe/zos-workflows-for-zowe-sdk";

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
    const response: IActiveWorkflows = await ListWorkflows.getWorkflows(session);
    console.log(response.workflows);
})();
```
