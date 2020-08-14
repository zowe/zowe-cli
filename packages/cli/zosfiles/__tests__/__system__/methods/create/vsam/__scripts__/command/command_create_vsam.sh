#!/bin/bash
dsn=$1
sec=$2
set -e

echo "================Z/OS FILES CREATE DATA-SET-VSAM==============="
zowe zos-files create data-set-vsam "$1" $2
if [ $? -gt 0 ]
then
    exit $?
fi
