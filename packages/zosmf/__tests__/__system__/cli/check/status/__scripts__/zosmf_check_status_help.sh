#!/bin/bash
set -e

echo "================ZOSMF HELP==============="
bright zosmf check status --help
if [ $? -gt 0 ]
then
    exit $?
fi

echo "================ZOSMF VIEW INFO HELP WITH RFJ==========="
bright zosmf check status --help --rfj
exit $?
