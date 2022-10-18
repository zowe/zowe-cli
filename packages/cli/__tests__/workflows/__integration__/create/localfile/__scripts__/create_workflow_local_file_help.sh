#!/bin/bash
set -e

echo "================Z/OS WORKFLOWS CREATE LOCAL-FILE HELP==============="
zowe zos-workflows create workflow-from-local-file --help
if [ $? -gt 0 ]
then
	exit $?
fi

echo "================Z/OS WORKFLOWS CREATE LOCAL-FILE HELP RFJ==========="
zowe zos-workflows create workflow-from-local-file --help --rfj
exit $?