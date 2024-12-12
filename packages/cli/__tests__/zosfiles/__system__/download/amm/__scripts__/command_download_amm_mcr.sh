#!/bin/bash
dsn=$1
pattern=$2
mcr=$3
set -e

echo "================Z/OS FILES DOWNLOAD ALL MEMBER DATA SET==============="
zowe zos-files download amm "$dsn" "$pattern" --max-concurrent-requests "$mcr"
if [ $? -gt 0 ]
then
    exit $?
fi
