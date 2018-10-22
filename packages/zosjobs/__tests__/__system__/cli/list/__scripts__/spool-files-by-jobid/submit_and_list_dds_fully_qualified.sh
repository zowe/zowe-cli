#!/bin/bash

JCL=$1
HOST=$2
PORT=$3
USER=$4
PASS=$5

# TODO - delete the job from spool
# Submit the job and ensure the RC is 0
JOBID="$(zowe jobs submit ds "$JCL" --host $HOST --port $PORT --user $USER --pass $PASS --ru=false --rff jobid --rft string)"
CMDRC=$?
if [ $CMDRC -gt 0 ]
then
    echo $JOBID 1>&2
    echo "Submit returned a non-zero return code" 1>&2
    exit $CMDRC
fi
echo $JOBID
# Loop until the status is output
STATUS=""
while [ "$STATUS" != "OUTPUT" ]; do 
    
    # get the status
    STATUS="$(zowe zos-jobs view job-status-by-jobid $JOBID --host $HOST --port $PORT --user $USER --pass $PASS --ru=false --rff status --rft string)"
    RC=$?
    if [ $RC -gt 0 ]
    then
        echo $STATUS 1>&2
        echo "The submit data set command returned a non-zero return code: $RC" 1>&2
        exit $RC
    fi
done 

zowe zos-jobs list spool-files-by-jobid $JOBID --host $HOST --port $PORT --user $USER --pass $PASS --ru=false
exit $?
