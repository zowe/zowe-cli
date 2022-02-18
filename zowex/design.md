# Daemon Mode Design Overview

Zowe CLI start-up time can be slow: 3 - 15 seconds.  This often occurs in virtualized environments where the directories, into which the Zowe CLI is installed, are geographically remote from the server that hosts the virtualized environments. Part of the reason this operation can be slow is the overhead involved in the startup of the Node.js runtime (measured with V8 instrumentations). The Node.js modules used by the Zowe CLI must be loaded every time a user issues another zowe command. The module loading process can be time consuming due to the delays associated with network transfers over a large geographic distance.

A customer site can address this situation by installing Zowe CLI onto a disk that is located in the same geographic location as the site's server of virtual environments. Pointing the ZOWE_CLI_HOME directory to a disk drive that is also co-located with the server will also help.

When the Zowe CLI user community at a given customer site does not have the adminstrative privileges to control where the Zowe CLI is installed, an alternative approach is to use the Zowe-CLI daemon to significantly improve performance.

## Solution Overview

***This solution should NOT be attempted in an environment where multiple individuals use the same system (i.e. a shared Linux server).***

The Zowe CLI can run as a persistent “daemon” process to absorb the one-time startup of Node.js modules. A native executable client will then communicate with the daemon via TCP/IP sockets.

Root level help, `zowe --help` response time is reduced from ~3 seconds to just under 1 second in daemon mode. At a site with a remote virtualized environment, the response time can change from around 30 seconds to around 2 seconds.

In testing a solution, the root command tree takes longer to execute than lower level command tree items, e.g. `zowe -h` is observably slower than `zowe jobs list -h` which has near instantaneous response time

## Native Executable Client

***This client should NOT be used in an environment where multiple individuals use the same system (i.e. a shared Linux server).***

Our native executable client communicates with the Zowe CLI persistent process (daemon) over named pipes on Windows, and Unix sockets on other operating systems. An environment variable can set the named pipe or Unix socket used by the daemon. The environment variable named `ZOWE_DAEMON=<PATH>` is used to specify the pipe's name or socket's location. If that variable is unset, the default is `<username>\ZoweDaemon` for Windows, and `<homedir>/.zowe-daemon.sock` on other operating systems.

## Enabling daemon-mode

***Daemon-mode should NOT be enabled in an environment where multiple individuals use the same system (i.e. a shared Linux server).***

Executables for all supported operating systems are included in the Zowe CLI NPM package. To make use of daemon mode, you must run the command `zowe daemon enable`. That command will copy the correct 'zowe' executable for your operating system into your $ZOWE_CLI_HOME/bin directory. You will be instructed to place the $ZOWE_CLI_HOME/bin directory on your PATH ahead of the directory into which NPM installed the Node.js 'zowe' script. After that, each 'zowe' command that you type will run the native executable.

When you run your next 'zowe' command, the executable will automatically launch the daemon in the background and it then sends your desired command to the daemon for processing. Your first such command will be slow, because the daemon process must be started. All future 'zowe' commands will then be much faster.

The daemon will continue to run until you close your command-line terminal window. If you logout and login to your computer each day, your first 'zowe' command in your terminal window will automatically start the daemon.


  Example:

  ```text
  zowe --version
  Starting a background process to increase performance ...
  7.0.0-next.202111111904

  zowe --version
  7.0.0-next.202111111904
  ```


## Disabling daemon-mode

If you want to stop using daemon mode, you can issue the `zowe daemon disable` command. That command will remove the zowe executable from your $ZOWE_CLI_HOME/bin directory and it will stop any running Zowe daemon.

## Implementation Details

The Zowe executable is written in the Rust programming language.

Imperative is updated in several places to write to a stream in addition to / instead of stdout & stderr.  A stream is passed in yargs "context" which is our own user data.

### Zowe CLI Server

The Node.js zowe script is updated to launch a server when an undocumented `--daemon` parm is supplied.  The server is a simple tcpip server.

- Server startup is managed by `packages/cli/src/daemon/DaemonDecider.ts`
- Daemon communication is managed by `packages/cli/src/daemon/DaemonClient.ts`

### Protocol

At a high level:

1. Zowe CLI server is started automatically by the native `zowe` executable client. It can also be started manually by running the Node.js Zowe script as `YourPathtoNodeJsScript/zowe --daemon`, although this is not the recommended approach due to its greater complexity.
2. The `zowe` native executable client passes zowe commands to the server via TCP/IP.
3. The Zowe daemon responds with text data from command output as it normally would, but the response is directed onto its socket connection instead of to a console window.

Since the Zowe CLI has features like:

- progress bars
- writing to stderr
- prompting for user input
- exiting process with non-zero
- writing output to stdout & stderr

we use a JSON object to describe communication between both server and client.

`IDaemonRequest.ts` & `IDaemonResponse.ts` in the imperative repo describe some of rules and keyword / value parts for data sent between the server and client.

#### Examples

The daemon server may send sample messages to the daemon client like:
```
"{\"stdout\":\"ca11 (default) \\nca112\\ntest\\ntso1\\n\"}"
"{\"stderr\":\"\\nWarning: The command 'profiles list' is deprecated.\\n\"}
"{\"stderr\":\"Recommended replacement: The 'config list' command\\n\"}"
"{\"exitCode\":0}"
```

Or:
```
{"prompt":"Enter the host name of your service: "}
```

The daemon client sends messages to the daemon server like:
```
{
  "argv": ["zosmf", "check", "status", "--rfj"],
  "cwd": "C:\\dev",
  "env": {"ZOWE_OPT_PORT": "1443"},
  "stdinLength": 0
}
```

Or:
```
{"stdin":"zosmf.com\r\n"}
```
