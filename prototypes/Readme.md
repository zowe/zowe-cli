The purpose of this **prototypes** folder is to provide a home for prototype or proof-of-concept code. As an example, new, experimental code that implements a compelling feature may be good model for the future permanent implementation of that feature.

During experiments, you might place a new class into a particular package to confirm that an idea is feasible. However, that code may not be complete enough to be built and packaged into the product. Lint rules might fail on this new code. You may not have any tests yet, so code coverage verification may fail.

You do not want this new code to cause Zowe build pipelines to fail, but you do not want to lose the useful work that has been completed. Placing your source file(s) under the **prototypes** directory is a way to keep your valuable experiment and not break the Zowe build process.

Place your source file into a  path under the **prototypes** directory that mirrors the real directory path . Personally, I like to create a hard link from the file in my real file path to an identical file path under the **prototypes** directory. That way I can import, compile, and debug in the real directory until I complete experiments. Before committing, I can just delete the file in the real directory path and the remaining hard-linked file in the **prototypes** directory path will have all of the latest changes.
