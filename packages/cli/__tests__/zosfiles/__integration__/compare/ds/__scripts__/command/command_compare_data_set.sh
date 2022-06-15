#!/bin/bash
dsn=$1
dsn2=$2
set -e

echo "================Z/OS FILES COMPARE DATA SET==============="
zowe files compare ds "$dsn" "$dsn2"
if [ $? -gt 0 ]
then
    exit $?
fi