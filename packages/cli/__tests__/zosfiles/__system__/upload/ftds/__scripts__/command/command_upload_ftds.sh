#!/bin/bash
set -e

echo "================Z/OS FILES UPLOAD DATA SET==============="
zowe zos-files upload file-to-data-set "$1" $2 $3
if [ $? -gt 0 ]
then
    exit $?
fi