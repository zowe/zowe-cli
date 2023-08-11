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

## Webpacking/bundling alongside your project

Some projects leverage a JavaScript bundler, such as Webpack or Vite, to minify and compress their Node.js packages.
While the Secrets SDK does support Webpack, developers who want to bundle the Secrets SDK alongside their package should set up a `prebuilds` folder alongside the same directory as their extension's build folder.

For example, if your extension build output is placed in the "out" folder, your directory structure should look like this:

```
your-extension/
├── src
├── out
│   └── bundledExtension.js
└── prebuilds
    └── (node binaries for Secrets SDK)
```

This can be accomplished by executing a Node.js script that creates a symbolic link between the Secrets SDK and the aforementioned `prebuilds` folder. Run this script in the same directory as your extension's build folder, or update the script according to your extension path:

```js
// Install the dependencies for your package using `npm install` or `yarn`. Then:
const { symlink } = require("fs");
const { join } = require("path");
// The last argument for this function provides support for Windows symlinks.
symlink("/path/to/node_modules/@zowe/secrets-for-zowe-sdk/prebuilds", join(process.cwd(), "prebuilds"), "dir");
```
**Note** that the target path for your environment may vary depending on where your *node_modules* folder is located. 

Developers only need to run this script if the symbolic link does not already exist. This will allow the `prebuilds` folder to be populated
with the latest platform binaries for the Secrets SDK.

If you are bundling a VSCode extension, and are using a `.vscodeignore` file, you should allow the prebuilds folder before packaging as a VSIX:

```
!prebuilds/**
```

### Updating imports

Some extenders might import `keytar` directly as a dependency. In these cases, extenders should import the `keyring` module from this package instead.

**Take caution when importing** as the import process is slightly different than `node-keytar`:

Before:  
```js
const keytar = require("node-keytar");
// ES6 import:
import * as keytar from "node-keytar";
```

After:  
```js
const { keyring } = require("@zowe/secrets-for-zowe-sdk");
// ES6 import:
import { keyring } from "@zowe/secrets-for-zowe-sdk";
```

Notice that the keyring module must be accessed from the dependency imports before use.
To reduce the amount of code that needs updated, users can use an import alias to the phrase "keytar":

```js
const { keyring: keytar } = require("@zowe/secrets-for-zowe-sdk");
// ES6 import:
import { keyring as keytar } from "@zowe/secrets-for-zowe-sdk";

// Existing code, such as the example below, can remain unchanged with this import alias:
keytar.setPassword("Hello", "World", "ExamplePassword");
```