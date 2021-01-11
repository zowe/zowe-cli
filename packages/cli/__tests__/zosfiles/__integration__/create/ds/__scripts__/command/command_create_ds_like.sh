#!/bin/bash
set -e

echo "================Z/OS FILES CREATE DS==============="
zowe files create data-set my.data.copy --like my.data.orig --lrecl 1024
if [ $? -gt 0 ]
then
    exit $?
fi
