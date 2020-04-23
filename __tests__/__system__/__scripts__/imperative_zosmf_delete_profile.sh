#!/bin/bash
profile=$1
set -e

echo "================ZOSMF HELP==============="
zowe profiles delete zosmf $*
if [ $? -gt 0 ]
then
    exit $?
fi