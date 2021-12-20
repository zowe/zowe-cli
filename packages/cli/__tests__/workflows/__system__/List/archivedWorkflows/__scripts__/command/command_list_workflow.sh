#!/bin/bash
wname=$1
definiton=$2
sysname=$3
owner=$4
set -e

echo "================Z/OS WORKFLOWS LIST ARCHIVED WORKFLOWS==========="

zowe wf list arw --rfj
if [ $? -gt 0 ]
then
    exit $?
fi