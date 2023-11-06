# z/OS USS Package

Contains APIs to interact with USS on z/OS (using the z/OS SSH service).

## Installation Instructions

The z/OS USS SDK has a dependency on the ssh2 package. This package allows for more secure cryptographic ciphers to be used first on supporting hardware. In order to do this, the dependency attempts to build some native modules at install time.

If these modules cannot be built, the dependency will continue to function, without the optimal cipher list order. However, some error messaging may be visible. These errors can be safely ignored, if desired.

To consume the optimal cipher list and build the native modules, the following software is pre-requisite:

### Windows
We recommend NodeJS be installed with Chocolatey, which includes most of the required tooling. An additional tool, [CMake](https://cmake.org/download/), will need to be installed in addition to Chocolatey.

Alternatively, install the following:

- Python 3.7 or greater
- [CMake](https://cmake.org/download/)
- Choose one of the following:
  - Visual Studio Build Tools
    - "Visual C++ build tools" workload
  - Visual Studio Community
    - "Desktop development with C++" workload

### Unix
- Python 3.7 or greater
- [CMake](https://cmake.org/download/)
- `make`
- A C/C++ Compiler (i.e. `gcc-c++`, `g++`)

### MacOS
- Python 3.7 or greater
- [CMake](https://cmake.org/download/)
- XCode
  - Including `XCode Command Line Tools`

## API Examples

**Check disk space on file system containing home directory**

```typescript
import { ProfileInfo } from "@zowe/core-for-zowe-sdk";
import { Shell, SshSession } from "@zowe/zos-uss-for-zowe-sdk";

(async () => {
    // Load connection info from default SSH profile
    const profInfo = new ProfileInfo("zowe");
    await profInfo.readProfilesFromDisk();
    const sshProfAttrs = profInfo.getDefaultProfile("ssh");
    const sshMergedArgs = profInfo.mergeArgsForProfile(sshProfAttrs, { getSecureVals: true });
    const session = new SshSession(ProfileInfo.initSessCfg(sshMergedArgs.knownArgs));

    await Shell.executeSsh(session, "df .", (data: string) => {
        if (data.trim()) console.log(data);
    });
})().catch((err) => {
    console.error(err);
    process.exit(1);
});
```

#
**Make a script executable**

```typescript
import { ProfileInfo } from "@zowe/core-for-zowe-sdk";
import { Shell, SshSession } from "@zowe/zos-uss-for-zowe-sdk";

(async () => {
    // Load connection info from default SSH profile
    const profInfo = new ProfileInfo("zowe");
    await profInfo.readProfilesFromDisk();
    const sshProfAttrs = profInfo.getDefaultProfile("ssh");
    const sshMergedArgs = profInfo.mergeArgsForProfile(sshProfAttrs, { getSecureVals: true });
    const session = new SshSession(ProfileInfo.initSessCfg(sshMergedArgs.knownArgs));

    await Shell.executeSshCwd(session, "chmod +x test.sh", "/tmp", (data: string) => {
        if (data.trim()) throw new Error(data);
    });
})().catch((err) => {
    console.error(err);
    process.exit(1);
});
```
