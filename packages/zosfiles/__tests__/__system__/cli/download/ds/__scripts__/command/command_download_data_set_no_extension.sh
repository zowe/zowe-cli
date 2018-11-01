#!/bin/bash
dsn=$1
two=$2
set -e

# echo "================Z/OS FILES DOWNLOAD DATA SET==============="
zowe zos-files download ds "$1" -e ""
if [ $? -gt 0 ]
then
    exit $?
fi