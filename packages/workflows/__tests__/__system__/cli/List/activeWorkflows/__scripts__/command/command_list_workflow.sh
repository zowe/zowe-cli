#!/bin/bash
wname=$1
definiton=$2
sysname=$3
owner=$4
set -e

zowe zos-workflows list act $wname "$definiton" $sysname $owner
if [ $? -gt 0 ]
then
    exit $?
fi