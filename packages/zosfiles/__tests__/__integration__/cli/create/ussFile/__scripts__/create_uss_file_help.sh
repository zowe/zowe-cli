#!/bin/bash
set -e

echo "================Z/OS FILES CREATE USS FILE HELP==============="
zowe zos-files create file --help
if [ $? -gt 0 ]
then
    exit $?
fi

echo "================Z/OS FILES CREATE USS FILE HELP WITH RFJ==========="
zowe zos-files create file --help --rfj
exit $?
