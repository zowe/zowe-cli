#!/bin/bash
zowe zos-jobs submit uss-file "/a/ibmuser/ussfile.txt" --wait-for-active --directory "./thisshouldgetasyntaxerror"
exit $?
