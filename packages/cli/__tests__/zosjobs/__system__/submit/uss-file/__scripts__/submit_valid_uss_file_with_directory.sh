#!/usr/bin/env bash
# pass the uss file name as an argument to the script
zowe zos-jobs submit uss-file $1 $2 $3
exit $?
