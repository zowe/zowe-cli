#!/bin/bash
set -e

echo "================Z/OS FILES UPLOAD USS FILE==============="
zowe zos-files upload file-to-uss -b "$1" $2 $3
if [ $? -gt 0 ]
then
    exit $?
fi