#!/bin/bash
hlq=$1
set -e

echo "================Z/OS FILES INVOKE AMS-STATEMENTS==============="
bright zos-files invoke ams-statements "DELETE $1.TEST.VSAM.DATA.SET CLUSTER"  --rfj
if [ $? -gt 0 ]
then
    exit $?
fi
