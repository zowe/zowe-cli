#!/bin/bash
set -e

echo "================TSO HELP==============="
zowe profiles delete tso $*
if [ $? -gt 0 ]
then
    exit $?
fi