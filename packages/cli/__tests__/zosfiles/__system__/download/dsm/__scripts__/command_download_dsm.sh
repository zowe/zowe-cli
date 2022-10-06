#!/bin/bash
set -e

zowe zos-files download dsm $*
if [ $? -gt 0 ]
then
    exit $?
fi
