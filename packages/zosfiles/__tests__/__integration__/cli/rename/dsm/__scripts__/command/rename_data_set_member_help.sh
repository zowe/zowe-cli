#!/bin/bash
set -e

echo "================Z/OS FILES RENAME DATA SET MEMBER HELP==============="
zowe zos-files rename dsm --help
if [ $? -gt 0 ]
then
    exit $?
fi