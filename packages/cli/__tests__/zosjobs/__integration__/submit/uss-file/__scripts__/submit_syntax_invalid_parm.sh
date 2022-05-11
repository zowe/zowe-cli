#!/bin/bash
MSYS_NO_PATHCONV=1; ZOWE_USE_DAEMON=0; zowe zos-jobs submit uss-file "/a/ibmuser/ussfile.txt" blah
exit $?
