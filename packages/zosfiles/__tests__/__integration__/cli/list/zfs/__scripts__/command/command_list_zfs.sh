#!/bin/bash
dsn=$1

set -e

zowe zos-files list zfs -p fakepath -f fakefs
if [ $? -gt 0 ]
then
    exit $?
fi