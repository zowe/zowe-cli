#!/bin/bash
set -e

echo "================Z/OS FILES CREATE HELP==============="
bright zos-files delete ds --help
if [ $? -gt 0 ]
then
    exit $?
fi

echo "================Z/OS CFILES CREATE HELP WITH RFJ==========="
bright zos-files delete ds --help --rfj
exit $?
