#!/bin/bash
set -e

echo "================Z/OS FILES CREATE USS DIRECTORY HELP==============="
zowe zos-files create dir --help
if [ $? -gt 0 ]
then
    exit $?
fi

echo "================Z/OS FILES CREATE USS DIRECTORY HELP WITH RFJ==========="
zowe zos-files create dir --help --rfj
exit $?