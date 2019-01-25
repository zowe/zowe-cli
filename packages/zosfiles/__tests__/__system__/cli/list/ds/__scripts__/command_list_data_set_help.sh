#!/bin/bash
set -e

echo "================Z/OS FILES LIST DATA SET HELP==============="
bright zos-files list ds --help
if [ $? -gt 0 ]
then
    exit $?
fi

echo "================Z/OS CFILES LIST DATA SET HELP WITH RFJ==========="
bright zos-files list ds --help --rfj
exit $?