#!/bin/bash
MSYS_NO_PATHCONV=1 zowe zos-jobs submit uss-file "/a/ibmuser/ussfile.txt" blah
exit $?
