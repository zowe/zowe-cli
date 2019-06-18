#!/bin/bash
set -e

echo "================Z/OS FILES DELETE HELP==============="
zowe zos-files delete zfs --help
if [ $? -gt 0 ]
then
    exit $?
fi

echo "================Z/OS FILES DELETE HELP WITH RFJ==========="
zowe zos-files delete zfs --help --rfj
exit $?
