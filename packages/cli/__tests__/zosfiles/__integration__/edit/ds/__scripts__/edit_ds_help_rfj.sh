#!/bin/bash
set -e

echo "================Z/OS FILES EDIT DATA SET HELP==============="
zowe zos-files edit ds --help --rfj
if [ $? -gt 0 ]
then
    exit $?
fi