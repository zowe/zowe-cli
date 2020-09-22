#!/bin/bash
set -e

echo "================ZOSMF CREATE PROFILE==============="
zowe profiles create zosmf $*
if [ $? -gt 0 ]
then
    exit $?
fi