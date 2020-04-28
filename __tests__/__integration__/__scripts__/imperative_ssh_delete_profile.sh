#!/bin/bash
set -e

echo "================SSH HELP==============="
zowe profiles delete ssh $*
if [ $? -gt 0 ]
then
    exit $?
fi