#!/usr/bin/env bash
JOBID=$(zowe jobs submit ds "$1" --rff jobid --rft string)

zowe zos-jobs download output $JOBID --wfa
exit $?