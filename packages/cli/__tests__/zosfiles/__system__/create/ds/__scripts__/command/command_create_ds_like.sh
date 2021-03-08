#!/bin/bash
set -e

echo "================Z/OS FILES CREATE DS==============="
zowe files create data-set "$1.test.data.set.like" --like $2
if [ $? -gt 0 ]
then
    exit $?
fi
