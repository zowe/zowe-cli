#!/bin/bash

JCL=$1
HOST=$2
PORT=$3
USER=$4
PASS=$5

# Submit the command and get the JSON response with the JOBID field
JOBID=$(zowe zos-jobs submit data-set "$JCL" --host $HOST --port $PORT --user $USER --password $PASS --ru=false --rff jobid --rft string)
RC=$?
if [ $RC -gt 0 ]
then
    echo $JOBID 1>&2
    echo "The submit data set command returned a non-zero return code: $RC"
    exit $RC
fi

# view the status of the job
zowe zos-jobs view job-status-by-jobid $JOBID --host $HOST --port $PORT --user $USER --password $PASS --ru=false
exit $?
