# Zowe Aucompletion for bash

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

[![asciicast](https://asciinema.org/a/243646.svg)](https://asciinema.org/a/243646)

## Installation procedure

### Linux
1) copy `zowe` file to  `/etc/bash_completion.d/zowe`
```
sudo cp zowe /etc/bash_completion.d/zowe
```
2) start a new `bash` terminal

**NOTE**: files in `/etc/bash_completion.d` do not have to have execute privilege. 

If you don't have an access to `/etc/bash_completion.d/`, store `zowe` file in a `zowe_autocompletion` add 
```sh
. zowe_autocompletion/zowe
``` 
at the end of your `.bashrc` file.

### Mac
1) enable bash completion on mac because it is not activated by default see instructions:
https://www.simplified.guide/macos/bash-completion

2) copy `zowe`  file to  `/usr/local/etc/bash_completion.d/zowe`   
3) start a new `bash` terminal 

**NOTE**: files in `/usr/local/etc/bash_completion.d/zowe` do not have to have execute privilege. 

### Windows
Windows is not supported.

## Troubleshooting
To enable debug messages of the autocompletion script uncomment `#logfile="log"`. `log` file is created in current directory.

## Limitations
Listing of datasets is using default zosmf profile.
