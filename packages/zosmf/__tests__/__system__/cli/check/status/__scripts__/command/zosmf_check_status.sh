#!/bin/bash
profile=$1
set -e

echo "================ZOSMF HELP==============="
zowe zosmf check status $1
if [ $? -gt 0 ]
then
    exit $?
fi
