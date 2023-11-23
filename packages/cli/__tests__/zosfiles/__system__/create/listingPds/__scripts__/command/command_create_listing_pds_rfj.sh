#!/bin/bash
hlq=$1
set -e

echo "================Z/OS FILES CREATE DATA-SET-LISTING ==============="
zowe zos-files create data-set-listing "$1.test.data.set.listing" --rfj
if [ $? -gt 0 ]
then
    exit $?
fi
