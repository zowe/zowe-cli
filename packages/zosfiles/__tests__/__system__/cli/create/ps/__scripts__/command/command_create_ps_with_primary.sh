#!/bin/bash
hlq1=$1
set -e

echo "================Z/OS FILES CREATE DATA-SET-SEQUENTIAL==============="
zowe zos-files create data-set-sequential "$1.test.data.set.ps.primary" --ps 20 --pa
if [ $? -gt 0 ]
then
    exit $?
fi
