
    // __________________________________________________________________________
    private static runningInVsCode: boolean = null;

    /**
     * Report if the current app is running as a VSCode app (extension).
     * We only need to perform this action once per process.
     * Future calls to this function just return our first-time result
     * which is recorded in ProcessUtils.runningInVsCode.
     *
     * @returns {boolean} - True if VsCode app. False otherwise.
     */
    public static isVsCodeApp(): boolean {
        if (ProcessUtils.runningInVsCode === null) {
            ProcessUtils.runningInVsCode = true;
            try {
                // try to get the path to the vscode module used by VSCode extensions
                require.resolve("vscode");
            } catch {
                ProcessUtils.runningInVsCode = false;
            }
        }
        return ProcessUtils.runningInVsCode;
    }
