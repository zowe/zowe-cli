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

## Troubleshooting

`keyring` is a native Node.js addon. This package ships prebuilt binaries for every [supported platform](/packages/secrets/src/keyring/README.md#compatibility) in its `prebuilds` folder, and its `install` script builds one from source only when none of them match the platform being installed on.

Zowe CLI declares this package as an **optional** dependency, so a failure in that install script does not fail `npm install`. npm leaves the package out and still reports success. The CLI keeps working, but it can no longer read or write credentials, and previously the first sign of trouble was this error, much later, the first time a command needed a credential:

```
Failed to load Keytar module: ...
```

Zowe CLI now checks for a loadable prebuild during `postinstall` and prints the platform target it expected. The steps below resolve it.

### Confirm the problem

Run this from the directory Zowe CLI is installed in — `$(npm root -g)/@zowe/cli` for a global install:

```shell
node -e "console.log(typeof require('@zowe/secrets-for-zowe-sdk').keyring.getPassword)"
```

`function` means secure credential storage works. A `MODULE_NOT_FOUND` error means npm skipped the package. Any other error, usually naming a `.node` file or a shared library, means the binary is there but the operating system will not load it.

### 1. Find out why the install failed

npm hides install script output by default, so the actual reason is rarely still on screen. Reinstall with `--foreground-scripts` to see it:

```shell
npm install -g @zowe/cli --foreground-scripts
```

### 2. Install the prerequisites it reports

- A failed `cargo` or `napi` command means no prebuild matched your platform and the source build could not run. Install the Rust toolchain from [rustup.rs](https://rustup.rs), then repeat step 1.
- A missing `libsecret-1.so.0` means the Linux libsecret runtime is absent. Install it with `apt install libsecret-1-0` (Debian/Ubuntu) or `yum install libsecret` (RHEL/Fedora). No rebuild is needed afterward — just re-run the Zowe CLI command that failed.
- On Linux you also need a running Secret Service provider, such as `gnome-keyring`, for credentials to be stored at all.

### 3. Rebuild the SDK in place

If the package is installed but has no usable binary, you can repair it without reinstalling the CLI. This re-runs the prebuild check and, if needed, the source build:

```shell
npm rebuild @zowe/secrets-for-zowe-sdk
```

Run it from the directory Zowe CLI is installed in, or add `-g` for a global install.

### 4. Install the SDK yourself

When the install script keeps failing but your platform *is* in the compatibility table, the prebuild you need is already inside the published tarball — only the script that verifies it is failing. Unpack the package and skip the script:

```shell
cd "$(npm root -g)/@zowe/cli"
npm install --no-save --ignore-scripts @zowe/secrets-for-zowe-sdk@8.36.0
```

In PowerShell:

```powershell
cd "$(npm root -g)\@zowe\cli"
npm install --no-save --ignore-scripts @zowe/secrets-for-zowe-sdk@8.36.0
```

Match the version to the one in the `optionalDependencies` of your installed `@zowe/cli/package.json`. Re-run the check in [Confirm the problem](#confirm-the-problem) afterward.

### Unsupported platforms

If your platform is not in the [compatibility table](/packages/secrets/src/keyring/README.md#compatibility), no prebuild exists and a source build is the only option, which requires the Rust toolchain. Until then, Zowe CLI can still run against a configuration with no secure properties, or you can supply credentials per command or through environment variables.

---

For more detailed information, see [src/keyring/EXTENDERS.md](/packages/secrets/src/keyring/EXTENDERS.md).