#!/bin/bash
set -e

echo "================Z/OS FILES CREATE DATA-SET HELP==============="
zowe files create --help
if [ $? -gt 0 ]
then
    exit $?
fi

