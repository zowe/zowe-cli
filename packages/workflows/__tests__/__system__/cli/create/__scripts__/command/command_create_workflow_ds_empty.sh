#!/bin/bash
set -e

echo "================Z/OS WORKFLOWS CREATE DATA-SET EMPTY==============="
bright zos-workflows create workflow-from-data-set
if [ $? -gt 0 ]
then
    exit $?
fi