#!/usr/bin/env bash
# pass the JCL as stdin to this script
cat $1 | zowe zos-jobs submit stdin --host $2 --port $3 --user $4 --password $5 --ru=false
exit $?