#!/bin/bash
hlq=$1
set -e

echo "================Z/OS FILES INVOKE AMS-STATEMENTS==============="
bright zos-files invoke ams-statements "DEFINE CLUSTER (NAME ($1.TEST.VSAM.DATA.SET) CYLINDERS (5 2 ) VOLUMES(STG100))"  --rfj
if [ $? -gt 0 ]
then
    exit $?
fi
