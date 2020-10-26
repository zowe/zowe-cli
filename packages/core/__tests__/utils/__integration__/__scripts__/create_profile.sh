#!/bin/bash
set -e
type=$1
name=$2

echo "================CREATE PROFILE==============="
zowe profiles create $type $name $3
if [ $? -gt 0 ]
then
    exit $?
fi