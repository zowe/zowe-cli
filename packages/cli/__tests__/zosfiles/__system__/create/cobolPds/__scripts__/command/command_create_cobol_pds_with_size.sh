#!/bin/bash
hlq=$1
set -e

echo "================Z/OS FILES CREATE DATA-SET-COBOL==============="
zowe zos-files create data-set-cobol "$1.test.data.set.cobol.size" --size 2CYL --pa
if [ $? -gt 0 ]
then
    exit $?
fi
