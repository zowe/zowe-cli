#!/bin/bash
set -e

echo "================Z/OS FILES EDIT DATA SET==============="
zowe files edit ds "$1" $2 $3
if [ $? -gt 0 ]
then
    exit $?
fi