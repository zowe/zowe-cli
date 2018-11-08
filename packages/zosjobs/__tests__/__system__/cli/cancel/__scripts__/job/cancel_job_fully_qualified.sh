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
JOBID=`zowe jobs submit lf "$JCL" --host $HOST --port $PORT --user $USER --pass $PASS --ru=false --rff jobid --rft string`
RC=$?
if [ $RC -gt 0 ]
then
    echo $JOBID 1>&2
    echo "Submit returned a non-zero return code" 1>&2
    exit $RC
fi

# Cancel the job
zowe jobs cancel job $JOBID --host $HOST --port $PORT --user $USER --pass $PASS --ru=false 
RC=$?

if [ $RC -gt 0 ]
then
    echo "The delcancelete job command returned a non-zero rc: $RC" 1>&2
    exit $RC
fi
