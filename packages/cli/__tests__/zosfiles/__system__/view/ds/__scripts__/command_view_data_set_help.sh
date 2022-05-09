#!/bin/bash
set -e

echo "================Z/OS FILES VIEW DATA SET HELP==============="
zowe files view ds --help
if [ $? -gt 0 ]
then
    exit $?
fi

echo "================Z/OS CFILES VIEW DATA SET HELP WITH RFJ==========="
zowe files view ds --help --rfj
exit $?