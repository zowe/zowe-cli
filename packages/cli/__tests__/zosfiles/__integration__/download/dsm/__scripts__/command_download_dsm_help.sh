#!/bin/bash
set -e

echo "================Z/OS FILES DOWNLOAD DATASET MATCHING HELP==============="
zowe zos-files download dsm --help
if [ $? -gt 0 ]
then
    exit $?
fi

echo "================Z/OS FILES DOWNLOAD DATASET MATCHING HELP WITH RFJ==========="
zowe zos-files download dsm --help --rfj
exit $?