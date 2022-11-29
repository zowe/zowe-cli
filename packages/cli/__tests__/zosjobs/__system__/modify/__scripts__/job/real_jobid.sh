#!/bin/bash

# Submit the job and ensure the RC is 0
JOBID=`zowe jobs submit ds "$1" --rff jobid --rft string`
RC=$?
if [ $RC -gt 0 ]
then
    echo $JOBID 1>&2
    echo "Submit returned a non-zero return code" 1>&2
    exit $RC
fi

# Use modify command with a real jobid
zowe zos-jobs modify job $JOBID --release
# cleanup and cancel fake job
zowe zos-jobs cancel job $JOBID
zowe zos-jobs delete job $JOBID
exit $?
