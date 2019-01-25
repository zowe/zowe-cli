#!/bin/bash
hlq=$1
set -e

echo "================Z/OS FILES CREATE DATA-SET-CLASSIC ==============="
bright zos-files create data-set-classic "$1.test.data.set.classic" --rfj
if [ $? -gt 0 ]
then
    exit $?
fi
