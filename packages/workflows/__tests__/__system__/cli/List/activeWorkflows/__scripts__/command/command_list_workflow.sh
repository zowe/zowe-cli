#!/bin/bash
wname=$1
definiton=$2
sysname=$3
owner=$4
set -e

bright wf list acw $wname --rfj
if [ $? -gt 0 ]
then
    exit $?
fi