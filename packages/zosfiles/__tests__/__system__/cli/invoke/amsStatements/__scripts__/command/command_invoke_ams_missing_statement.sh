#!/bin/bash
file=$1
set -e

echo "================Z/OS FILES INVOKE AMS-STATEMENTS==============="
bright zos-files invoke ams-statements
if [ $? -gt 0 ]
then
    exit $?
fi
