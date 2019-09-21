#!/bin/bash
set -e

echo "================Z/OS FILES CREATE USS FILE==============="
zowe zos-files create file
if [ $? -gt 0 ]
then
    exit $?
fi
