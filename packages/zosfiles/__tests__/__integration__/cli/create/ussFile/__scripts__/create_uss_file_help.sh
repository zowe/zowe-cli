#!/bin/bash
set -e

echo "================Z/OS FILES CREATE ZOS-FILE-SYSTEM HELP==============="
zowe zos-files create file --help
if [ $? -gt 0 ]
then
    exit $?
fi

echo "================Z/OS FILES CREATE ZOS-FILE-SYSTEM HELP WITH RFJ==========="
zowe zos-files create file --help --rfj
exit $?
