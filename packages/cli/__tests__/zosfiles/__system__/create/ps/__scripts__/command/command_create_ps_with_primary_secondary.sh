#!/bin/bash
hlq1=$1
set -e

echo "================Z/OS FILES CREATE DATA-SET-SEQUENTIAL==============="
zowe zos-files create data-set-sequential "$1.test.data.set.ps.second" --ps 20 --ss 5 --attributes
if [ $? -gt 0 ]
then
    exit $?
fi
