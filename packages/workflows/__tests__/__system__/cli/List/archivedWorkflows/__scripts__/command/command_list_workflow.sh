#!/bin/bash
wname=$1
definiton=$2
sysname=$3
owner=$4
set -e

echo "================Z/OS WORKFLOWS LIST ARCHIVED WORKFLOWS==========="

bright wf list arw --wn $wname --rfj
if [ $? -gt 0 ]
then
    exit $?
fi