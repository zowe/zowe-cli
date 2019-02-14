#!/bin/bash
wname=$1
definiton=$2
sysname=$3
owner=$4
set -e

echo "================Z/OS WORKFLOWS CREATE DATA-SET ==============="
bright zos-workflows list act $wname "$definiton" $sysname $owner
if [ $? -gt 0 ]
then
    exit $?
fi