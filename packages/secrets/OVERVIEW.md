# Secrets SDK

Secrets for Zowe SDK is a new development package used in the following Zowe releases:
- Zowe CLI
    - v7.18.0 and above from the NPM package
    - Bundle v2.11.0 and above from [Zowe.org](https://www.zowe.org/download#download-v2)
- Zowe Explorer and Zowe Explorer API
    - v2.10.0 and above (v2 LTS)
    - v1.22.5 and above (v1 LTS)

The `keyring` module in this package replaces node-keytar. Node-keytar was developed by Atom, and is no longer maintained as of December 15th, 2022.

## Impact on End Users

### Zowe CLI

CLI users should not be affected by this change. It is intended to be a drop-in replacement for node-keytar, so existing credentials will still be accessible.

### Zowe Explorer

- **Most** Zowe Explorer users should not be affected by this change.
- Some Zowe Explorer users may be affected by this change. Specifically, users connecting over remote environments with Zowe Explorer are required to re-enter credentials. 
    - Since keytar has been removed from VS Code for the next release, Zowe Explorer cannot access the local credential vault while the extension is running through a remote server.
    - "Remote environments" include:
        - Remote SSH
        - Remote Tunnel
        - Remote Docker
    - [Click here](https://github.com/zowe/vscode-extension-for-zowe/wiki/Usage-in-Remote-Environments) for more information.

## Impact on Extenders

**CAUTION:** Regardless of whether you extend Zowe CLI or Zowe Explorer, developers that directly reference `keytar` as a dependency or dev dependency must use the new `keyring` module in `@zowe/secrets-for-zowe-sdk`.

### Zowe CLI

- Developers can continue using the credential manager utilities from Imperative.
- Developers that indirectly use Zowe CLI to store and load secure credentials are not affected.

### Zowe Explorer

- Extenders that leverage Zowe Explorer API and Webpack (or another bundler) are required to update their extensions to provide prebuilds for the Secrets SDK. 
    - This involves providing a folder named `prebuilds` with the Secrets SDK binaries alongside their extension root directory (same level as `package.json`).
    - [Click here](https://github.com/zowe/zowe-cli/blob/master/packages/secrets/src/keyring/EXTENDERS.md#webpackingbundling-alongside-your-project) for more information on this process.
- Extenders that do not use a bundler can continue using the credential manager utilities from Zowe Explorer API. These extensions are not affected by this change.

---

For more information on how to use the Secrets SDK, visit the [README for the `keyring` module](/packages/secrets/src/keyring/README.md).