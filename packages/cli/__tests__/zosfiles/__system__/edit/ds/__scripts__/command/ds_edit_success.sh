#!/bin/bash
set -e

echo y | zowe files edit ds "$1" --editor cat
if [ $? -gt 0 ]
then
    exit $?
fi