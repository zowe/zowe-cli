#!/bin/bash
basepath=$1
set -e

echo "================Z/OS FILES CREATE USS FILE==============="
zowe zos-files create file "$basepath/test.txt" $2
if [ $? -gt 0 ]
then
    exit $?
fi
