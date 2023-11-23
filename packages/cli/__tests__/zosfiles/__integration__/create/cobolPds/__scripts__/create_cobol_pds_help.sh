#!/bin/bash
set -e

echo "================Z/OS FILES CREATE DATA-SET-COBOL HELP==============="
zowe zos-files create data-set-cobol --help
if [ $? -gt 0 ]
then
    exit $?
fi

echo "================Z/OS FILES CREATE DATA-SET-COBOL HELP WITH RFJ==========="
zowe zos-files create data-set-cobol --help --rfj
exit $?
