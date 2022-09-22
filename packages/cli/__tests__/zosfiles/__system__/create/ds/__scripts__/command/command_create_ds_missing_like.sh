#!/bin/bash
set -e

echo "================Z/OS FILES CREATE DS==============="
zowe files create data-set "$1.test.data.set.withoutLike" --host $2 --user $3 --pw $4
if [ $? -gt 0 ]
then
    exit $?
fi
