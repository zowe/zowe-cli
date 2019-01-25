#!/bin/bash
set -e

echo "================Z/OS FILES CREATE DATA-SET-C HELP==============="
bright zos-files create data-set-c --help
if [ $? -gt 0 ]
then
    exit $?
fi

echo "================Z/OS FILES CREATE DATA-SET-C HELP WITH RFJ==========="
bright zos-files create data-set-c --help --rfj
exit $?
