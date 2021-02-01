#!/bin/bash
set -e

echo "================ZOSMF HELP==============="
zowe zosmf list systems --help
if [ $? -gt 0 ]
then
    exit $?
fi

echo "================ZOSMF VIEW INFO HELP WITH RFJ==========="
zowe zosmf list systems --help --rfj
exit $?
