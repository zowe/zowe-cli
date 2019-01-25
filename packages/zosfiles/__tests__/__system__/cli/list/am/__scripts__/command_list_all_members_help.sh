#!/bin/bash
set -e

echo "================Z/OS FILES LIST All MEMBERS HELP==============="
bright zos-files list am --help
if [ $? -gt 0 ]
then
    exit $?
fi

echo "================Z/OS CFILES LIST All MEMBERS HELP WITH RFJ==========="
bright zos-files list am --help --rfj
exit $?