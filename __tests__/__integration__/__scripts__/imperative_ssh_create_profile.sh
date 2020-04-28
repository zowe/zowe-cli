#!/bin/bash
set -e

echo "================SSH CREATE PROFILE==============="
zowe profiles create ssh $*
if [ $? -gt 0 ]
then
    exit $?
fi