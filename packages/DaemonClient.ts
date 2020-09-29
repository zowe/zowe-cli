import { Imperative } from "@zowe/imperative";
import * as net from "net";


/**
 * Class for handling client connections to our persistent service (e.g. daemon mode)
 * @export
 * @class DaemonClient
 */
export class DaemonClient {

    /**
     * Undocumented paramter to cause daemon to shutdown
     * @private
     * @static
     * @memberof DaemonClient
     */
    private static readonly STOP_KEY = "--shutdown";

    /**
     * Creates an instance of DaemonClient.
     * @param {net.Socket} mClient
     * @param {net.Server} mServer
     * @memberof DaemonClient
     */
    constructor(private mClient: net.Socket, private mServer: net.Server) {
    }

    /**
     * Run an instance of this client and wait for proper events
     * @memberof DaemonClient
     */
    public run() {
        Imperative.api.appLogger.trace('daemon client connected');
        this.mClient.on('end', this.end.bind(this));
        this.mClient.on('close', this.close.bind(this));
        this.mClient.on('data', this.data.bind(this));
    }

    /**
     * End event handler triggered when client disconnects
     * @private
     * @memberof DaemonClient
     */
    private end() {
        Imperative.api.appLogger.trace('daemon client disconnected');
    }

    /**
     * Close event handler triggered when client closes connection
     * @private
     * @memberof DaemonClient
     */
    private close() {
        Imperative.api.appLogger.trace('client closed');
    }

    /**
     * Data event handler triggered for whenever data comes in on a connection
     * @private
     * @param {Buffer} data
     * @memberof DaemonClient
     */
    private data(data: Buffer) {
        // NOTE(Kelosky): this is not exposed yet, but will allow for a clean shut down if undocumented `--shutdown`
        // is written to the persistent Processor.
        const stopOffset = data.toString().indexOf(DaemonClient.STOP_KEY);
        if (stopOffset > -1) {
            if (this.mServer) {
            Imperative.api.appLogger.debug("shutting down")
                this.mClient.write(`Terminating server`);
                this.mClient.end();
                this.mServer.close()
            }
            // accept input parameters as we do without running in a server mode and pass our clients stream
            // handle as context
        } else {
            Imperative.api.appLogger.trace(`daemon input command: ${data.toString()}`)
            Imperative.commandLine = data.toString();
            Imperative.parse(data.toString(), { stream: this.mClient });
        }
    }
}