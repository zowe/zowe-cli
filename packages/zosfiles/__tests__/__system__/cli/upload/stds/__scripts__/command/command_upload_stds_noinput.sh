#!/bin/bash
set -e
zosFile=$1
shift

echo "========= Z/OS FILES UPLOAD FROM STDIN ========="
zowe zos-files upload stdin-to-data-set "$zosFile" $* < /dev/null

if [ $? -gt 0 ]
then
    exit $?
fi
