#!/bin/bash
path=$1
set -e

echo "================Z/OS FILES VIEW USS FILE==============="
zowe files view uss-file "$path"
if [ $? -gt 0 ]
then
    exit $?
fi