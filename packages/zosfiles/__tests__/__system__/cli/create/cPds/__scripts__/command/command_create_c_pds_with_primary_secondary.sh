#!/bin/bash
hlq1=$1
set -e

echo "================Z/OS FILES CREATE DATA-SET-C==============="
zowe zos-files create data-set-c "$1.test.data.set.c.second" --ps 20 --ss 5 --pa
if [ $? -gt 0 ]
then
    exit $?
fi
