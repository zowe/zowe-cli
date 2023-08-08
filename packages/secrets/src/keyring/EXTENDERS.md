# Usage (Extenders)

## What is `keyring`?

`keyring` is a cross-platform module meant to interact with OS (operating system) credential storage. `keyring` is written in Rust, and uses other Rust libraries to interface with credential storage APIs (application programming interfaces).

## Why switch to `keyring`?

As `node-keytar` is now unmaintained, there was a demand for a replacement that can function identically to the original module.

As `keyring` was modeled after `node-keytar`, the same operations can be performed in credential storage:

- Storing credentials
- Retrieving credentials
- Searching for passwords based on a matching label
- Searching for matching credentials based on a prefix/query
- Deleting credentials

**Currently, there are no breaking changes** between the use of `node-keytar` and `keyring`. This is intended by design.

From a developer's perspective, one can simply update existing extenders or plug-ins to import the keyring module from `@zowe/secrets-for-zowe-sdk` instead of `node-keytar`, allowing for a straightforward transition. All functions previously exported in `node-keytar` will be available in `keyring`. Simply add `@zowe/secrets-for-zowe-sdk` to your project using `npm` or `yarn`.

Importing a function from `keyring` is identical to the `node-keytar` import process:

```ts
// Import all functions under a namespace...
import { keyring } from "@zowe/secrets-for-zowe-sdk";
// Or, use require to import the keyring module.
const { keyring } = require("@zowe/secrets-for-zowe-sdk");
```

After the desired functions are imported, feel free to use them in the same fashion as the `node-keytar` functions. For the examples below, `async/await` keywords are used, but the functions can also be used with `.then/.catch` promise blocks:

```ts
getPassword("TestService", "AccountA")
.then((pw) => {
    console.log("The password for TestService/AccountA is:", pw);
})
.catch((err) => {
    console.error("An error occurred!", err.message);
});
```

**Examples:**

```ts
// Set a password with a given service and account name
// Password will be stored under <service>/<account>
await keyring.setPassword("TestService", "AccountA", "Apassword");

// Get a password, given a service and account name
await keyring.getPassword("TestService", "AccountA");

// Find credentials based on a matching label
await keyring.findCredentials("TestService");

// Find password that matches a service and account
await keyring.findPassword("TestService/AccountA");

// Delete a credential w/ the provided service and account name
await keyring.deletePassword("TestService", "AccountA");
```