#!/bin/bash
hlq=$1
set -e

echo "================Z/OS FILES CREATE DATA-SET-C==============="
zowe zos-files create data-set-listing "$1.test.data.set.listing"
if [ $? -gt 0 ]
then
    exit $?
fi
