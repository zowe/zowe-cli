const path = require("path");

function getTargetName() {
    switch (process.platform) {
        case "win32":
            return `win32-${process.arch}-msvc`;
        case "linux":
            const isMusl =
                process.report.getReport().header.glibcVersionRuntime == null;
            const abi = isMusl ? "musl" : "gnu";
            switch (process.arch) {
                case "arm":
                    return `linux-arm-${abi}eabihf`;
                default:
                    return `linux-${process.arch}-${abi}`;
            }
        case "darwin":
        default:
            return `${process.platform}-${process.arch}`;
    }
}

const binaryPath = require.resolve(`./keyring.${getTargetName()}.node`, {
    paths: [__dirname, path.join(__dirname, "..", "..", "prebuilds")],
});

const {
    deletePassword,
    findCredentials,
    findPassword,
    getPassword,
    setPassword,
} = require(binaryPath);

module.exports.deletePassword = deletePassword;
module.exports.findCredentials = findCredentials;
module.exports.findPassword = findPassword;
module.exports.getPassword = getPassword;
module.exports.setPassword = setPassword;