#!/bin/bash
set -e

echo "================ZOSMF HELP==============="
zowe zosmf list system
if [ $? -gt 0 ]
then
    exit $?
fi
