#!/bin/bash
set -e

echo "================Z/OS FILES COMPARE DATA SET==============="
zowe files compare ds "$1" "$2" $3 
if [ $? -gt 0 ]
then
    exit $?
fi