#!/bin/bash
set -e

echo "================TSO HELP==============="
zowe profiles create tso $*
if [ $? -gt 0 ]
then
    exit $?
fi