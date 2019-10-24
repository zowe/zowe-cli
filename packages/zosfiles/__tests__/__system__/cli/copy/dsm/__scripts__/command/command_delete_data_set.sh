#!/bin/bash
dsn=$1
set -e

echo "================Z/OS FILES DELETE DATA SET==============="
zowe zos-files delete data-set $dsn -f
if [ $? -gt 0 ]
then
    exit $?
fi
