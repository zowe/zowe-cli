#!/bin/bash

# Max attempt count
ATTEMPTS=10

# Wait time between attempts
WAIT=10

# Submit the job and ensure the RC is 0
JOBID=`zowe jobs submit lf "$1" --rff jobid --rft string`
RC=$?
if [ $RC -gt 0 ]
then
    echo $JOBID 1>&2
    echo "Submit returned a non-zero return code" 1>&2
    exit $RC
fi

# Modify the job with a different class
zowe zos-jobs modify job $JOBID --release
RC=$?

# view the status of the job
zowe zos-jobs view job-status-by-jobid $JOBID --rfj
exit $?
