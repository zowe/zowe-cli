#!/bin/bash
set -e

echo "================Z/OS FILES COPY DATA SET MEMBER HELP==============="
zowe zos-files copy data-set-member --help
if [ $? -gt 0 ]
then
    exit $?
fi
