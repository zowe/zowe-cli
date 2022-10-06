#!/bin/bash
profile=$1
set -e

echo "================ZOSMF list systems==============="
zowe zosmf list systems $1
if [ $? -gt 0 ]
then
    exit $?
fi
