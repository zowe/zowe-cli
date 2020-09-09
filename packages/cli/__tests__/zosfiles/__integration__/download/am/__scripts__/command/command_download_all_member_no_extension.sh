#!/bin/bash
dsn=$1
rfj=$2
set -e

# echo "================Z/OS FILES DOWNLOAD ALL MEMBER DATA SET==============="
zowe zos-files download am "$1" -e "" $2 
if [ $? -gt 0 ]
then
    exit $?
fi
