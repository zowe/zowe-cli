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

echo "================Z/OS FILES INVOKE AMS-FILE HELP==========="
bright zos-files invoke ams-file --help
if [ $? -gt 0 ]
then
    exit $?
fi

echo "================Z/OS FILES INVOKE AMS-FILE HELP WITH RFJ==========="
bright zos-files invoke ams-file --help --rfj
exit $?
