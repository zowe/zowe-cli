#!/bin/bash

JCL=$1
HOST=$2
PORT=$3
USER=$4
PASS=$5

# Max attempt count
ATTEMPTS=10

# Wait time between attempts
WAIT=10

# Submit the job and ensure the RC is 0
JOBID=`zowe jobs submit ds "$JCL" --host $HOST --port $PORT --user $USER --pass $PASS --ru=false --rff jobid --rft string`
RC=$?
if [ $RC -gt 0 ]
then
    echo $JOBID 1>&2
    echo "Submit returned a non-zero return code" 1>&2
    exit $RC
fi

# Loop until the job goes to the output queue
until [ $ATTEMPTS -gt 0 ]
do
    STATUS=`zowe jobs view job-status-by-jobid $JOBID --host $HOST --port $PORT --user $USER --pass $PASS --ru=false --rff status --rft string`
    RC=$?
    if [ $RC -gt 0 ] ; then
        echo $STATUS 1>&2
        echo "The view job status command returned a non-zero rc: $RC" 1>&2
        exit $RC
    fi
    if [ "$STATUS" = "OUTPUT" ] ; then
        break
    else
        ((ATTEMPTS--))
        sleep $WAIT
    fi
done

# Check status
if [ $ATTEMPTS -eq 0 -a "$STATUS" != "OUTPUT" ]; then
    echo "Wait time limit reached" 1>&2
    exit 1
fi

# Purge the job
zowe jobs delete job $JOBID --host $HOST --port $PORT --user $USER --pass $PASS --ru=false 
RC=$?

if [ $RC -gt 0 ]
then
    echo "The delete job command returned a non-zero rc: $RC" 1>&2
    exit $RC
fi
