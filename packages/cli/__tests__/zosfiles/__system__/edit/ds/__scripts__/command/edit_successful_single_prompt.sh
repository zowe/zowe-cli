#!/bin/bash
set -e

echo done | zowe files edit ds "$1"
if [ $? -gt 0 ]
then
    exit $?
fi