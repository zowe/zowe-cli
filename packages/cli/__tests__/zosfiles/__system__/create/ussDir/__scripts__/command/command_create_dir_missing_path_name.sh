#!/bin/bash
set -e

echo "================Z/OS FILES USS DIRECTORY==============="
zowe zos-files create dir
if [ $? -gt 0 ]
then
    exit $?
fi
