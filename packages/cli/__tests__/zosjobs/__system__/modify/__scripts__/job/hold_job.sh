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

# Modify the job with a different class
zowe zos-jobs modify job $JOBID --hold
RC=$?

# view the status of the job
zowe zos-jobs view job-status-by-jobid $JOBID --rfj
# cleanup and cancel fake job
zowe zos-jobs cancel job $JOBID
zowe zos-jobs delete job $JOBID
exit $?
