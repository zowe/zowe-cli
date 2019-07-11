#!/usr/bin/env bash
# pass the JCL as stdin to this script
cat $1 | zowe zos-jobs submit stdin $2 $3
exit $?