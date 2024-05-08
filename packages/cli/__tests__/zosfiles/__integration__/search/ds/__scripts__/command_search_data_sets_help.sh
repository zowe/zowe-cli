#!/bin/bash
set -e

echo "================Z/OS FILES SEARCH DATA SETS HELP==============="
zowe zos-files search ds --help
if [ $? -gt 0 ]
then
    exit $?
fi

echo "================Z/OS FILES SEARCH DATA SETS HELP WITH RFJ==========="
zowe zos-files search ds --help --rfj
exit $?