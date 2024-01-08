#!/bin/bash
wname=$1
definition=$2
sysname=$3
owner=$4
set -e

echo "================Z/OS WORKFLOWS LIST ACTIVE WORKFLOWS==========="

zowe wf list aw --wn $wname --rfj
if [ $? -gt 0 ]
then
    exit $?
fi