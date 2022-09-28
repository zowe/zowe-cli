#!/bin/bash
sn=$1
wn=$2
rcb=$3
pfs=$4
set -e

echo "================Z/OS WORKFLOWS START WORKFLOW-NAME ==============="
zowe zos-workflows start workflow-step $sn --workflow-name $wn --resolve-conflict-by $rcb $pfs
if [ $? -gt 0 ]
then
    exit $?
fi