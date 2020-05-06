#!/bin/bash
set -e

echo "================SSH DELETE PROFILE==============="
zowe profiles delete ssh $*
if [ $? -gt 0 ]
then
    exit $?
fi