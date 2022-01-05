#!/bin/bash
sn=$1
wk=$2
rcb=$3
pfs=$4
set -e

echo "================Z/OS WORKFLOWS START WORKFLOW-KEY ==============="
zowe zos-workflows start workflow-step $sn --workflow-key $wk --resolve-conflict-by $rcb $pfs
if [ $? -gt 0 ]
then
    exit $?
fi