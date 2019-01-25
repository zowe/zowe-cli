#!/bin/bash
set -e

echo "================Z/OS FILES DOWNLOAD ALL MEMBER HELP==============="
bright zos-files download am --help
if [ $? -gt 0 ]
then
    exit $?
fi

echo "================Z/OS FILES DOWNLOAD ALL MEMBER HELP WITH RFJ==========="
bright zos-files download am --help --rfj
exit $?