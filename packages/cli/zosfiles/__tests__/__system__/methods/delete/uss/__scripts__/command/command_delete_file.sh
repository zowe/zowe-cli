#!/bin/bash
uss=$1
forsure=$2
set -e

echo "================Z/OS FILES DELETE FILE==============="
zowe zos-files delete uss $1 $2
if [ $? -gt 0 ]
then
    exit $?
fi
