#!/bin/bash
set -e

echo "================Z/OS FILES CREATE DATA-SET-VSAM HELP==============="
zowe zos-files create data-set-vsam --help
if [ $? -gt 0 ]
then
    exit $?
fi

echo "================Z/OS FILES CREATE DATA-SET-VSAM HELP WITH RFJ==========="
zowe zos-files create data-set-vsam --help --rfj
exit $?
