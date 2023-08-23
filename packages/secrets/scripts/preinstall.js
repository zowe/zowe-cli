const { join } = require("path");

try {
    require(join("..", "lib", "index.js"));   
} catch (err) {
    if (err.code === "ERR_MODULE_NOT_FOUND" || err.code === "MODULE_NOT_FOUND") {
        throw new Error(`Unable to find prebuilds for Secrets SDK keyring module: ${err.message}`);
    }
}