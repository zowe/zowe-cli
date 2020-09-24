import { Logger, LoggingConfigurer, IImperativeConfig } from "@zowe/imperative";

/**
 * Utility function to configure the core logger
 */
function configureLogger(home: string, config: IImperativeConfig ): void {
    Logger.initLogger(LoggingConfigurer.configureLogger(home, config));
}

export { configureLogger as configureLogger };