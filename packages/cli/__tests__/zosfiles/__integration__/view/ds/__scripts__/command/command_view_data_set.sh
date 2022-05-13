#!/bin/bash
dsn=$1
set -e

echo "================Z/OS FILES VIEW DATA SET==============="
zowe files view ds "$dsn"
if [ $? -gt 0 ]
then
    exit $?
fi