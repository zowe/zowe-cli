#!/bin/bash
set -e

echo "================Z/OS FILES CREATE DS==============="
zowe files create data-set "$2.test.data.set.noLike" --host $1 --user $2 --pw $3
if [ $? -gt 0 ]
then
    exit $?
fi
