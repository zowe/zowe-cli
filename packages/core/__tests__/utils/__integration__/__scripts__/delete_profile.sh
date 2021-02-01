#!/bin/bash
set -e
type=$1
name=$2

echo "================DELETE PROFILE==============="
zowe profiles delete $type $name
if [ $? -gt 0 ]
then
    exit $?
fi