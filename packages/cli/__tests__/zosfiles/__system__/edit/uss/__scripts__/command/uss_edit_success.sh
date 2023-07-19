#!/bin/bash
set -e

echo done | zowe files edit uss "$1" --editor cat
if [ $? -gt 0 ]
then
    exit $?
fi