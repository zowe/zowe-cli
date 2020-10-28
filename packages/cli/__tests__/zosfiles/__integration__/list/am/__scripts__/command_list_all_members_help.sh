#!/bin/bash
set -e

echo "================Z/OS FILES LIST All MEMBERS HELP==============="
zowe zos-files list am --help
if [ $? -gt 0 ]
then
    exit $?
fi

echo "================Z/OS CFILES LIST All MEMBERS HELP WITH RFJ==========="
zowe zos-files list am --help --rfj
exit $?