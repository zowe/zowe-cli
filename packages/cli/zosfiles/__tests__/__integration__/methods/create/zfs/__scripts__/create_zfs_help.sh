#!/bin/bash
set -e

echo "================Z/OS FILES CREATE ZOS-FILE-SYSTEM HELP==============="
zowe zos-files create zos-file-system --help
if [ $? -gt 0 ]
then
    exit $?
fi

echo "================Z/OS FILES CREATE ZOS-FILE-SYSTEM HELP WITH RFJ==========="
zowe zos-files create zos-file-system --help --rfj
exit $?
