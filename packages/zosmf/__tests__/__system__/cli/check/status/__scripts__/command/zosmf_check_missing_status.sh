#!/bin/bash
set -e

echo "================ZOSMF HELP==============="
bright zosmf check statu
if [ $? -gt 0 ]
then
    exit $?
fi
