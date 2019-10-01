#!/bin/bash
basepath=$1
set -e

echo "================Z/OS FILES CREATE USS DIRECTORY==============="
zowe zos-files create dir "$basepath/testDir"
if [ $? -gt 0 ]
then
    exit $?
fi
