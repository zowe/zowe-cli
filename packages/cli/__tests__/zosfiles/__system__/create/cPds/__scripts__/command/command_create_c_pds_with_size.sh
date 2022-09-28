#!/bin/bash
hlq=$1
set -e

echo "================Z/OS FILES CREATE DATA-SET-C==============="
zowe zos-files create data-set-c "$1.test.data.set.c.size" --size 2CYL --pa
if [ $? -gt 0 ]
then
    exit $?
fi
