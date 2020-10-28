#!/bin/bash
set -e

echo "================ZOSMF DELETE PROFILE==============="
zowe profiles delete zosmf $*
if [ $? -gt 0 ]
then
    exit $?
fi