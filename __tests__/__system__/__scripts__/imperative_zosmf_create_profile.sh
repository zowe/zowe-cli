#!/bin/bash
set -e

echo "================ZOSMF HELP==============="
zowe profiles create zosmf $*
if [ $? -gt 0 ]
then
    exit $?
fi