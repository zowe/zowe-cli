# Zowe Autocompletion for bash

Autocompletion simplifies composing Zowe CLI commands.

```sh
zowe <tab><tab>
```
displays available options, commands or command groups
```sh
--available-commands    --response-format-json  <group>                 plugins                 provisioning            zos-files               zos-tso                 zosmf
--help                  --version               config                  profiles                zos-console             zos-jobs                zos-workflows
vlcvi01@VLCVI01W10:~/workspaces/zowe-cli/autocompletion$ zowe
```

At first glance it may look that autocompletion does not work because of very slow response time. This is caused by zowe cli performance. Autocompletion script runs `zowe ... --help` in background to extract suggestions.

Live demonstration
[![asciicast](https://asciinema.org/a/243646.svg)](https://asciinema.org/a/243646)

## Installation

### Linux (Ubuntu)
1) copy `zowe.bash` file to  `/etc/bash_completion.d/zowe.bash`
    ```
    sudo cp zowe.bash /etc/bash_completion.d/zowe.bash
    ```
2) start a new `bash` terminal

**NOTE**: files in `/etc/bash_completion.d` do not have to have execute privilege.

If you don't have an access to `/etc/bash_completion.d/`, copy `zowe.bash` file to `~/zowe_autocompletion/zowe.bash` add
```sh
. ~/zowe_autocompletion/zowe.bash
```
at the end of your `.bashrc` file.

### Mac
1) enable bash completion on mac because it is not activated by default see instructions:
https://www.simplified.guide/macos/bash-completion

2) copy `zowe.bash`  file to  `/usr/local/etc/bash_completion.d/zowe.bash`
3) start a new `bash` terminal

> [!NOTE]
> Files in `/usr/local/etc/bash_completion.d/zowe.bash` do not have to have execute privilege.

### Windows
 * Windows CMD is not supported.
 * WLS is supported  (see Linux)
 * bash via MINGW should work but you need: grep, awk

## Troubleshooting
To enable debug messages of the autocompletion script uncomment `#logfile="log"`. `log` file is created in current directory.

## Limitations
Listing of datasets is using the default zosmf profile.
