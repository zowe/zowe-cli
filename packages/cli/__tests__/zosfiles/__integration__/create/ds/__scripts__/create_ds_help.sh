#!/bin/bash
set -e

echo "================Z/OS FILES CREATE DATA-SET HELP==============="
zowe files create data-set --help
if [ $? -gt 0 ]
then
    exit $?
fi

