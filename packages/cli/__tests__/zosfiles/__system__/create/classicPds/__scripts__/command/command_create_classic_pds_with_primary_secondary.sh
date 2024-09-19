#!/bin/bash
hlq1=$1
set -e

echo "================Z/OS FILES CREATE DATA-SET-CLASSIC==============="
zowe zos-files create data-set-classic "$1.test.data.set.classic.second" --ps 20 --ss 5 --attributes
if [ $? -gt 0 ]
then
    exit $?
fi
