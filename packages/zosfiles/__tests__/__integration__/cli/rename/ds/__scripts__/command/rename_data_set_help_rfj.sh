#!/bin/bash
set -e

echo "================Z/OS FILES RENAME DATA SET HELP==============="
zowe zos-files rename ds --help --rfj
if [ $? -gt 0 ]
then
    exit $?
fi