#!/bin/bash
set -e

echo "================Z/OS FILES EDIT USS FILE HELP==============="
zowe zos-files edit uss --help --rfj
if [ $? -gt 0 ]
then
    exit $?
fi