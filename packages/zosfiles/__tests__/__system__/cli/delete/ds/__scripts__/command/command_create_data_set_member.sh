#!/bin/bash
dsn=$1
fpath=$2
set -e

echo "================Z/OS FILES CREATE PDS MEMBER==============="
zowe zos-files upload file-to-data-set "$2" "$1"
if [ $? -gt 0 ]
then
    exit $?
fi
