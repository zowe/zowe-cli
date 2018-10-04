#!/bin/bash
set -e

echo "================ZOSMF HELP==============="
zowe zosmf check statu
if [ $? -gt 0 ]
then
    exit $?
fi
