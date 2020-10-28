#!/bin/bash
hlq=$1
VOLSER=$2
set -e

echo "================Z/OS FILES INVOKE AMS-STATEMENTS==============="
zowe zos-files invoke ams-statements "DEFINE CLUSTER (NAME ($1.TEST.VSAM.DATA.SET) CYLINDERS (5 2 ) VOLUMES($VOLSER))"  --rfj
if [ $? -gt 0 ]
then
    exit $?
fi
