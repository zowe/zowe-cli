#!/bin/bash
dsn=$1

set -e

zowe zos-files list fs -p fakepath -f fakefs
if [ $? -gt 0 ]
then
    exit $?
fi