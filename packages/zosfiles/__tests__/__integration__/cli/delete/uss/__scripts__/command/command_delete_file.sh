#!/bin/bash
file=$1
forsure=$2
rfj=$3
set -e

echo "================Z/OS FILES DELETE DATA SET==============="
zowe zos-files delete uss-file "$1" $2 $3
if [ $? -gt 0 ]
then
    exit $?
fi
