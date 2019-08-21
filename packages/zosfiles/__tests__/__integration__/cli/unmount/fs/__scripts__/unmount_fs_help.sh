#!/bin/bash
set -e

echo "================Z/OS FILES UNMOUNT HELP==============="
zowe zos-files unmount fs --help
if [ $? -gt 0 ]
then
    exit $?
fi

echo "================Z/OS FILES UNMOUNT HELP WITH RFJ==========="
zowe zos-files unmount fs --help --rfj
exit $?
