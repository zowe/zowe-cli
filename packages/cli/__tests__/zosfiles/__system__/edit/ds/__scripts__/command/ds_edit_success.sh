#!/bin/bash
set -e

yes | zowe files edit ds "$1" --editor cat
if [ $? -gt 0 ]
then
    exit $?
fi