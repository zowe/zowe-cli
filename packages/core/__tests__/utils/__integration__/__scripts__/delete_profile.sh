#!/bin/bash
set -e
type=$1
name=$2

echo "================DELETE PROFILE==============="
# Can't use daemon because we need to override ZOWE_CLI_HOME
ZOWE_USE_DAEMON=false zowe profiles delete $type $name
if [ $? -gt 0 ]
then
    exit $?
fi