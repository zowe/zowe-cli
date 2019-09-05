#!/bin/bash
basepath=$1
set -e

echo "================Z/OS FILES CREATE DATA-SET-SEQUENTIAL==============="
zowe zos-files create file "$basepath/test.txt"
if [ $? -gt 0 ]
then
    exit $?
fi
