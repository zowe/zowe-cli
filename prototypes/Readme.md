The purpose of this **prototypes** folder is to provide a home for prototype or proof-of-concept code. As an example, new, experimental code that implements a compelling feature may be good model for the future permanent implementation of that feature.

During experiments, you might place a new class into a particular package to confirm that an idea is feasible. However, that code may not be complete enough to be built and packaged into the product. Lint rules might fail on this new code. You may not have any tests yet, so code coverage verification may fail.

You do not want this new code to cause Zowe build pipelines to fail, but you do not want to lose the useful work that has been completed. Placing your source file(s) under the **prototypes** directory is a way to keep your valuable experiment and not break the Zowe build process.

Place your source file into a path under the **prototypes** directory that mirrors the real directory path.

**Tip:** Create a hard link from the file in the real file path to an identical file path under the **prototypes** directory. That way imports, compiles, and debugging will work in the real directory during experiments, while all changes are automatically recorded in the **prototypes** path.

**Note:** Remember to delete a new file or revert an existing file in the real directory path. The remaining hard-linked file(s) in the **prototypes** directory path will still have all of the latest changes.
