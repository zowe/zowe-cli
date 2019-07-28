#!/bin/bash
fsn=$1
set -e

echo "================Z/OS FILES CREATE ZOS-FILE-SYSTEM==============="
zowe zos-files create zos-file-system "$fsn" --user ibmuser --pass 123456 --host google.com
if [ $? -gt 0 ]
then
    exit $?
fi
