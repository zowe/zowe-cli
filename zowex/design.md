# Daemon Mode Design Overview

Zowe CLI start up time can be slow 3 - 15 seconds.  Part of the reason this operation can be slow is the overhead involved in startup of the Node.js runtime (measured with V8 instrumentations).

## Solution Overview

We can run Zowe CLI as a persistent process “daemon” to have a one-time startup of the Node.js cost and have a native-built, Rust client to communicate with the daemon via TCP/IP sockets.

Root level help, `zowe --help` response time is reduced from ~3 seconds to just under ` second in daemon mode.

In testing a solution, the root command tree takes longer to execute than lower level command tree items, e.g. `zowe -h` is observably slower than `zowe jobs list -h` which has near instantaneous response time

### Rust Client

Native Rust client calls Zowe CLI persistent process (daemon).  An env var can be set for the port to connect to tcp socket.  `ZOWE_DAEMON=<PORT>` environmental variable used or default 4000.

Rust binderies are released on GitHub and could also be released on scoop, cargo, chocolatey, windows command installer, etc...

Rust client sets `--daemon-client-directory` (or `--dcd`) for Zowe CLI / imperative usage which is the daemon client directory.  This flag is hidden from Zowe help display
since it's not intended for end users.

Rust client is called `zowex.exe` while in PoC / validation stage.  Otherwise, we might call it `zowe` for seamless transition.
Imperative

Imperative is updated in several places to write to a stream in addition to / instead of stdout & stderr.  Stream is passed in yargs “context” which is our own user data.

dcd global flag added for Zowe CLI operations that implicitly depend on the current working directory.  For example, Zowe CLI daemon could be running at any arbitrary location on the system; however, we want `zowex` to operate against whatever directory it was run.  --dcd allows for alternate dcd.

### Zowe CLI Server

Zowe CLI is updated to launch a server if an undocumented `--daemon` parm is detected.  The server is a simple tcpip server.

- server startup is managed by `packages/cli/Processor.ts`
- daemon communication is managed by `packages/cli/DaemonClient.ts`

### Protocol

At a high level:

1. Zowe CLI server is started via `zowe --daemon`
2. `zowex` Rust client calls pass zowe commands to the server via tcp writing
3. zowe server responds with text data from command output as it normally would, but response is directed towards socket connection instead of to console

However, zowe CLI also has features like:

- progress bars
- writing to stderr
- prompting for user input

In these cases, a lightweight protocol is built onto the communication between server and client.  The protocol consists of "headers" that begin with `x-zowe-daemon-`.  If detected in data steam on either the client or server side, this data is parsed to control behavior between client and server.

`DaemonUtils.ts` in imperative describes some rules for headers sent from server to client.

All headers must appear on the same line without newline, are separated by `;`, and may contain PRECEDING data that is not part of a header.

#### Special headers - Server to Client

The following are headers with special meaning that are sent FROM the server TO the client.  Values for each header, immediately follow it after a `:` and are 32 bit integer types only.

##### General Identity headers

- `x-zowe-daemon-headers`, count of total headers being set, also marks beginning of headers
- `x-zowe-daemon-version`, version of the "protocol"
- `x-zowe-daemon-end`, end marker of passed headers
- `x-zowe-daemon-exit`, alternate exit code for daemon client to end with

##### x-zowe-daemon-progress

This header indicates a progress bar is being streamed from the server to the client.  The client needs to continuously write on the same line current progress until a header marks it complete.

##### x-zowe-daemon-prompt

This header indicates a prompt for user input is needed by the server from the client.  The client must prompt the user and send the response to the server.

#### Special headers - Client to Server

##### z-zowe-daemon-reply

This header is sent to the server contain a replay from `x-zowe-daemon-prompt`.

### Testing

- Obtain zowex.exe binary for your platform and add to PATH
- Run zowe as a background task with a hidden --daemon option:
  - Windows start zowe --daemon
  - Linux zowe --daemon &
  - pm2 pm2 start <global-npm-location>/node_modules/@zowe/cli/lib/main.js --name zowe-daemon -- --daemon
    - npm list -g | head -1 to see <global-npm-location>