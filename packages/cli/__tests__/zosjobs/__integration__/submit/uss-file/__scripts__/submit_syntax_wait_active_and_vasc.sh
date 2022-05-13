#!/bin/bash
# should get a syntax error
zowe zos-jobs submit uss-file "/a/ibmuser/ussfile.txt" --wait-for-active --vasc
exit $?
