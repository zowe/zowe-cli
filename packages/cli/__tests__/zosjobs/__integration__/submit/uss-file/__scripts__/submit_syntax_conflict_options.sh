#!/bin/bash
zowe zos-jobs submit uss-file "/a/ibmuser/ussfile.txt" --extension "./jcl"
exit $?
