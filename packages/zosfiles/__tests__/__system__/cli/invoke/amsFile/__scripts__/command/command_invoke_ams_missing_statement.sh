#!/bin/bash
file=$1
set -e

echo "================Z/OS FILES INVOKE AMS-FILE==============="
bright zos-files invoke ams-file
if [ $? -gt 0 ]
then
    exit $?
fi
