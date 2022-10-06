#!/bin/bash
set -e

echo "================Z/OS FILES CREATE PDS HELP==============="
zowe zos-files create pds --help
if [ $? -gt 0 ]
then
    exit $?
fi

echo "================Z/OS CFILES CREATE PDS HELP WITH RFJ==========="
zowe zos-files create pds --help --rfj
exit $?
