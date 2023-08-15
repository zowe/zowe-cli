# Secrets Package

Contains APIs for secure credential management.

## `keyring` API Examples

Developers that reference the dependency `keytar` directly in their code need to use the new `keyring` module from this package.

Use the `keyring` module in the same fashion as `keytar`.

### Storing and loading credentials

```js
const { keyring } = require("@zowe/secrets-for-zowe-sdk");
await keyring.setPassword("ServiceName", "AccountName", "SomePassword");

const password = await keyring.getPassword("ServiceName", "AccountName");
// password should equal "SomePassword"
```

### Finding a credential

```js
const { keyring } = require("@zowe/secrets-for-zowe-sdk");
const password = await keyring.findPassword("ServiceName/AccountName");
// password should equal "SomePassword"
```

### Finding all credentials matching service

```js
const { keyring } = require("@zowe/secrets-for-zowe-sdk");
const matchingCredentials = await keyring.findCredentials("ServiceName");
// returns: 
// [
//    { account: "AccountName", password: "SomePassword" },
//    ...
// ]
```

### Deleting a credential

```js
const { keyring } = require("@zowe/secrets-for-zowe-sdk");
const wasDeleted = await keyring.deletePassword("ServiceName", "AccountName");
// wasDeleted should be true; ServiceName/AccountName removed from credential vault
```

For more detailed information, see [src/keyring/EXTENDERS.md](/packages/secrets/src/keyring/EXTENDERS.md).