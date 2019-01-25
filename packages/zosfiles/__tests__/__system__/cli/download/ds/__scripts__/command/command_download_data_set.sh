#!/bin/bash
dsn=$1
two=$2
thr=$3
set -e

echo "================Z/OS FILES DOWNLOAD DATA SET==============="
bright zos-files download ds "$1" $2 $3
if [ $? -gt 0 ]
then
    exit $?
fi