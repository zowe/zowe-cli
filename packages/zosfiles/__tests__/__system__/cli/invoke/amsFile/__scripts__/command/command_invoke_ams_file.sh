#!/bin/bash
file=$1
set -e

echo "================Z/OS FILES INVOKE AMS-FILE==============="
zowe zos-files invoke ams-file "$1" $2
if [ $? -gt 0 ]
then
    exit $?
fi
