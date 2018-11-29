#!/bin/bash
dsn=$1
destination=$2

set -e

echo "================Z/OS FILES DOWNLOAD DATA SET==============="
zowe zos-files download ds "$dsn" --binary -f "$destination"
if [ $? -gt 0 ]
then
    exit $?
fi