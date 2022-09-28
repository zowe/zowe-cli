#!/bin/bash
set -e

echo "================TSO DELETE PROFILE==============="
zowe profiles delete tso $*
if [ $? -gt 0 ]
then
    exit $?
fi