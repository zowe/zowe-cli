#!/bin/bash
dsn=$1
set -e

echo "================Z/OS FILES CREATE PDS==============="
zowe zos-files create data-set-sequential "$1"
if [ $? -gt 0 ]
then
    exit $?
fi
