#!/bin/bash
set -e

echo "================SSH HELP==============="
zowe profiles create ssh $*
if [ $? -gt 0 ]
then
    exit $?
fi