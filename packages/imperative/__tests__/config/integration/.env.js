const path = require("path");
const basePath = "./__tests__/__results__/integration"
const testType = "Integration";

module.exports = {
    "FORCE_COLOR": "1",
    "JEST_STARE_RESULT_DIR": path.join(basePath, "html"),
    "JEST_JUNIT_OUTPUT": path.join(basePath, "junit/junit.xml"),
    "JEST_JUNIT_ANCESTOR_SEPARATOR": " > ",
    "JEST_JUNIT_CLASSNAME": `${testType}.{classname}`,
    "JEST_JUNIT_TITLE": "{title}",
    "JEST_SUIT_NAME": `${testType} Tests`
}
