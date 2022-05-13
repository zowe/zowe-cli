#!/bin/bash

JCL=$1
HOST=$2
PORT=$3
USER=$4
PASS=$5

# TODO - delete the job from spool
# Submit the job and ensure the RC is 0
JOBID="$(zowe jobs submit ds "$JCL" --host $HOST --port $PORT --user $USER --password $PASS --ru=false --rff jobid --rft string)"
CMDRC=$?
if [ $CMDRC -gt 0 ]
then
    echo $JOBID 1>&2
    echo "Submit returned a non-zero return code" 1>&2
    exit $CMDRC
fi

# Loop until the status is output
STATUS=""
while [ "$STATUS" != "OUTPUT" ]; do 
    
    # get the status
    STATUS="$(zowe zos-jobs view job-status-by-jobid $JOBID --host $HOST --port $PORT --user $USER --password $PASS --ru=false --rff status --rft string)"
    RC=$?
    if [ $RC -gt 0 ]
    then
        echo $STATUS 1>&2
        echo "The view job status command returned a non-zero rc: $RC" 1>&2
        exit $RC
    fi
done 

# Print all the spool files content
zowe zos-jobs view all-spool-content $JOBID --host $HOST --port $PORT --user $USER --password $PASS --ru=false
RC=$?
# Wait for a few seconds to node flushes the buffers
sleep 2
if [ $RC -gt 0 ]
then
    echo "The view all spool files content command returned a non-zero rc: $RC" 1>&2
    exit $RC
fi
