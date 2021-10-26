# Daemon Mode Design Overview

Zowe CLI start up time can be slow 3 - 15 seconds.  Part of the reason this operation can be slow is the overhead involved in startup of the Node.js runtime (measured with V8 instrumentations).

## Solution Overview

We can run Zowe CLI as a persistent process “daemon” to have a one-time startup of the Node.js cost and have a native-built, Rust client to communicate with the daemon via TCP/IP sockets.

Root level help, `zowe --help` response time is reduced from ~3 seconds to just under ` second in daemon mode.

In testing a solution, the root command tree takes longer to execute than lower level command tree items, e.g. `zowe -h` is observably slower than `zowe jobs list -h` which has near instantaneous response time

### Rust Client

Native Rust client calls Zowe CLI persistent process (daemon).  An env var can be set for the port to connect to tcp socket.  `ZOWE_DAEMON=<PORT>` environmental variable used or default `4000`.

Rust binderies are released on GitHub and could also be released on scoop, cargo, chocolatey, windows command installer, etc...

Rust client sets `--daemon-client-directory` (or `--dcd`) for Zowe CLI / imperative usage which is the daemon client directory.  This flag is hidden from Zowe help display
since it's not intended for end users.

Rust client is called `zowe.exe`.

Imperative is updated in several places to write to a stream in addition to / instead of stdout & stderr.  Stream is passed in yargs "context" which is our own user data.

`--dcd` hidden, global flag added for Zowe CLI operations that implicitly depend on the current working directory.  For example, Zowe CLI daemon could be running at any arbitrary location on the system; however, we want `zowe` to operate against whatever directory it was run.  `--dcd` allows for alternate `dcd`.

### Zowe CLI Server

Zowe CLI is updated to launch a server if an undocumented `--daemon` parm is detected.  The server is a simple tcpip server.

- server startup is managed by `packages/cli/Processor.ts`
- daemon communication is managed by `packages/cli/DaemonClient.ts`

### Protocol

At a high level:

1. Zowe CLI server is started via `zowe --daemon` manually or via native `zowe` client
2. `zowe` native client calls pass zowe commands to the server via tcp
3. zowe server responds with text data from command output as it normally would, but response is directed towards socket connection instead of to console

However, Zowe CLI also has features like:

- progress bars
- writing to stderr
- prompting for user input
- exiting process with non-zero
- writing output to stdout & stderr

So, we use a JSON object to describe communication between both server and client.

`IDaemonRequest.ts` & `IDaemonResponse.ts` in the imperative repo describe some of rules and keyword / value parts for data sent between server and client.

#### Examples

The daemon server may send sample messages to daemon client like:
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

The daemon client sends messages to server like:
```
{"reply":"zosmf.com\r\n","id":"daemon-client"}
```
### Testing

- Obtain zowe.exe binary for your platform and add to PATH
- Run zowe as a background task with a hidden `--daemon` option:
  - Windows start zowe --daemon
  - Linux zowe --daemon &
  - pm2 pm2 start <global-npm-location>/node_modules/@zowe/cli/lib/main.js --name zowe-daemon -- --daemon
    - npm list -g | head -1 to see <global-npm-location>