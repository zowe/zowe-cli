#!/bin/bash
set -e

echo "================Z/OS FILES CREATE DATA-SET-LISTING HELP==============="
zowe zos-files create data-set-listing --help
if [ $? -gt 0 ]
then
    exit $?
fi

echo "================Z/OS FILES CREATE DATA-SET-LISTING HELP WITH RFJ==========="
zowe zos-files create data-set-listing --help --rfj
exit $?
