#!/bin/bash
fsn=$1
set -e

echo "================Z/OS FILES CREATE USS DIRECTORY==============="
zowe zos-files create dir  --user ibmuser --pass 123456 --host google.com
if [ $? -gt 0 ]
then
    exit $?
fi
