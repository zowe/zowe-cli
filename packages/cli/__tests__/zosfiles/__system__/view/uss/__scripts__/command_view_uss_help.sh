#!/bin/bash
set -e

echo "================Z/OS FILES DOWNLOAD ALL MEMBER HELP==============="
zowe files view uss-file --help
if [ $? -gt 0 ]
then
    exit $?
fi

echo "================Z/OS FILES DOWNLOAD ALL MEMBER HELP WITH RFJ==========="
zowe files view uss-file --help --rfj
exit $?