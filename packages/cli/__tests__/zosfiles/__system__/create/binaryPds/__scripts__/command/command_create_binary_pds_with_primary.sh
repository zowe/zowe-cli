#!/bin/bash
hlq1=$1
set -e

echo "================Z/OS FILES CREATE DATA-SET-BINARY==============="
zowe zos-files create data-set-binary "$1.test.data.set.binary.primary" --ps 20 --attributes
if [ $? -gt 0 ]
then
    exit $?
fi
