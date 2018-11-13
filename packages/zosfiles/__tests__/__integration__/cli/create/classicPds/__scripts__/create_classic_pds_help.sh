#!/bin/bash
set -e

echo "================Z/OS FILES CREATE DATA-SET-CLASSIC HELP==============="
zowe zos-files create data-set-classic --help
if [ $? -gt 0 ]
then
    exit $?
fi

echo "================Z/OS FILES CREATE DATA-SET-CLASSIC HELP WITH RFJ==========="
zowe zos-files create data-set-classic --help --rfj
exit $?
