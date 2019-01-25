#!/bin/bash
hlq=$1
set -e

echo "================Z/OS FILES CREATE DATA-SET-SEQUENTIAL ==============="
bright zos-files create data-set-sequential "$1.test.data.set.ps" --rfj
if [ $? -gt 0 ]
then
    exit $?
fi
