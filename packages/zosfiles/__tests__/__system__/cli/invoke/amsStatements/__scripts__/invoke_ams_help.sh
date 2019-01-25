#!/bin/bash
set -e

echo "================Z/OS FILES INVOKE HELP==============="
bright zos-files invoke --help
if [ $? -gt 0 ]
then
    exit $?
fi

echo "================Z/OS FILES INVOKE HELP WITH RFJ==========="
bright zos-files invoke --help --rfj
if [ $? -gt 0 ]
then
    exit $?
fi

echo "================Z/OS FILES INVOKE AMS-STATEMENTS HELP==========="
bright zos-files invoke ams-statements --help
if [ $? -gt 0 ]
then
    exit $?
fi

echo "================Z/OS FILES INVOKE AMS-STATEMENTS HELP WITH RFJ==========="
bright zos-files invoke ams-statements --help --rfj
exit $?
