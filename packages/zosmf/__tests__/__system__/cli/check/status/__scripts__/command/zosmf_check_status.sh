#!/bin/bash
profile=$1
set -e

echo "================ZOSMF HELP==============="
bright zosmf check status $1
if [ $? -gt 0 ]
then
    exit $?
fi
