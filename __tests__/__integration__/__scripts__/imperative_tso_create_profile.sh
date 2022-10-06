#!/bin/bash
set -e

echo "================TSO CREATE PROFILE==============="
zowe profiles create tso $*
if [ $? -gt 0 ]
then
    exit $?
fi