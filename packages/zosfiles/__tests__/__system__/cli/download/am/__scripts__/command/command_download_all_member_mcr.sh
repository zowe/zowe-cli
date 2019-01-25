#!/bin/bash
dsn=$1
mcr=$2
set -e

echo "================Z/OS FILES DOWNLOAD ALL MEMBER DATA SET==============="
bright zos-files download am "$dsn" --max-concurrent-requests "$mcr"
if [ $? -gt 0 ]
then
    exit $?
fi
