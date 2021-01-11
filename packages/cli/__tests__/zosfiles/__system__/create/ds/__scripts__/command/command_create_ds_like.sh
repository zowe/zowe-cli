#!/bin/bash
set -e

echo "================Z/OS FILES CREATE DS==============="
zowe files create data-set my.data.copy --like my.data.orig 
if [ $? -gt 0 ]
then
    exit $?
fi
