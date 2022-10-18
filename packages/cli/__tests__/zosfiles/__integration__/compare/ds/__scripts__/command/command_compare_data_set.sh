#!/bin/bash
dsn=$1
dsn2=$2
opt1=$3
set -e

echo "================Z/OS FILES COMPARE DATA SET==============="
zowe files compare ds "$dsn" "$dsn2" $opt1
if [ $? -gt 0 ]
then
    exit $?
fi