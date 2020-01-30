#!/bin/bash
set -e

echo "================Z/OS FILES RENAME DATA SET HELP==============="
zowe zos-files rename ds --help
if [ $? -gt 0 ]
then
    exit $?
fi