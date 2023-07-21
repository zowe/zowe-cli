const path = require("path");

function getTargetName() {
    switch (process.platform) {
        case "win32":
            return `win32-${process.arch}-msvc`;
        case "linux":
            const isMusl = process.report.getReport().header.glibcVersionRuntime == null;
            switch (process.arch) {
                case "arm":
                    return "linux-arm-gnueabihf";
                case "arm64":
                    return `linux-arm64-${isMusl ? "musl" : "gnu"}`;
                case "ia32":
                    return "linux-ia32-gnu";
                case "x64":
                    return `linux-x64-${isMusl ? "musl" : "gnu"}`;
            }
        case "darwin":
        default:
            return `${process.platform}-${process.arch}`;
    }
}

const binaryPath = require.resolve(`keyring.${getTargetName()}.node`, {
    paths: [
        __dirname,
        path.join(__dirname, "prebuilds")
    ]
});
module.exports = require(binaryPath);
