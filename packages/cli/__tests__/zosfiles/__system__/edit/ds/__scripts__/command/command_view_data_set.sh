#!/bin/bash
set -e

echo "================Z/OS FILES VIEW DATA SET==============="
zowe files view ds "$1" $2 $3
if [ $? -gt 0 ]
then
    exit $?
fi