#!/bin/bash
hlq=$1
set -e

echo "================Z/OS FILES INVOKE AMS-STATEMENTS==============="
zowe zos-files invoke ams-statements "DELETE $1.TEST.VSAM.DATA.SET CLUSTER"
if [ $? -gt 0 ]
then
    exit $?
fi
