#!/bin/bash
set -e

echo "================Z/OS FILES LIST DATA SET HELP==============="
zowe zos-files list ds --help
if [ $? -gt 0 ]
then
    exit $?
fi

echo "================Z/OS CFILES LIST DATA SET HELP WITH RFJ==========="
zowe zos-files list ds --help --rfj
exit $?