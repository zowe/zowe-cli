#!/bin/bash

# Submit the command and get the JSON response with the JOBID field
JOBID=$(zowe zos-jobs submit data-set "$1" --rff jobid --rft string)
RC=$?
if [ $RC -gt 0 ]
then
    echo $JOBID 1>&2
    echo "The submit data set command returned a non-zero return code: $RC"
    exit $RC
fi

# view the status of the job
zowe zos-jobs view job-status-by-jobid $JOBID
exit $?
