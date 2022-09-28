#!/bin/bash
set -e

zowe zos-uss issue ss
if [ $? -gt 0 ]
then
    exit $?
fi