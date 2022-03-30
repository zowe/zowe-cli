#!/bin/bash
set -e
localfile="$1"
dsname="$2"
echo "================Z/OS FILES UPLOAD DATA SET==============="
zowe zos-files upload file-to-data-set "$localfile" "$dsname" -r
if [ $? -gt 0 ]
then
    exit $?
fi