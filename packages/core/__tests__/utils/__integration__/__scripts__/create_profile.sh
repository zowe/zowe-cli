#!/bin/bash
set -e
type=$1
name=$2

echo "================CREATE PROFILE==============="
# Can't use daemon because we need to override ZOWE_CLI_HOME
ZOWE_USE_DAEMON=false zowe profiles create $type $name $3
if [ $? -gt 0 ]
then
    exit $?
fi