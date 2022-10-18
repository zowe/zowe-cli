#!/bin/bash
set -e

echo "================Z/OS FILES LIST FS HELP==============="
zowe zos-files list fs --help
if [ $? -gt 0 ]
then
    exit $?
fi

echo "================Z/OS CFILES LIST FS HELP WITH RFJ==========="
zowe zos-files list fs --help --rfj
exit $?