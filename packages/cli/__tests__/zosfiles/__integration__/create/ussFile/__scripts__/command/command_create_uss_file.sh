#!/bin/bash
fsn=$1
set -e

echo "================Z/OS FILES CREATE USS FILE==============="
zowe zos-files create file  --user ibmuser --pass 123456 --host google.com
if [ $? -gt 0 ]
then
    exit $?
fi
