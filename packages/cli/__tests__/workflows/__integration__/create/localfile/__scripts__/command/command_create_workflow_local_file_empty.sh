#!/bin/bash
set -e

echo "================Z/OS WORKFLOWS CREATE USS-FILE EMPTY==============="
zowe zos-workflows create workflow-from-local-file
if [ $? -gt 0 ]
then
	exit $?
fi