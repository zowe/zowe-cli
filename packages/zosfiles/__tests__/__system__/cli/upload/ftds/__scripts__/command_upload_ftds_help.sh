#!/bin/bash
set -e

echo "================Z/OS FILES UPLOAD DATA SET HELP==============="
bright zos-files upload file-to-data-set --help
if [ $? -gt 0 ]
then
    exit $?
fi

echo "================Z/OS FILES UPLOAD DATA SET HELP WITH RFJ==========="
bright zos-files upload file-to-data-set --help --rfj
exit $?