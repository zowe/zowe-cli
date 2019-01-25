#!/bin/bash
dsn=$1
vol=$2
set -e

echo "================Z/OS FILES INVOKE AMS==============="
bright zos-files invoke ams-statements "DEFINE CLUSTER (NAME ($1) CYLINDERS (5 2 ) VOLUMES($2))"
if [ $? -gt 0 ]
then
    exit $?
fi
