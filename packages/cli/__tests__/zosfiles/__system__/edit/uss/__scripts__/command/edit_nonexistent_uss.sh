#!/bin/bash
set -e

echo "================Z/OS FILES EDIT USS FILE==============="
zowe files edit uss "$1"
if [ $? -gt 0 ]
then
    exit $?
fi