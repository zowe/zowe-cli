#!/bin/bash
set -e

JCL=$1
HOST=$2
PORT=$3
USER=$4
PASS=$5

# Submit two jobs and capture their IDs
JOBID1=`zowe zos-jobs submit data-set $JCL --host $HOST --port $PORT --user $USER --password $PASS --ru=false --rff jobid --rft string`
sleep 1
JOBID2=`zowe zos-jobs submit data-set $JCL --host $HOST --port $PORT --user $USER --password $PASS --ru=false --rff jobid --rft string`

sleep 1

echo "Listing jobs to find job IDs $JOBID1 and $JOBID2"

LIST_JOB_OUTPUT=`zowe zos-jobs list jobs --host $HOST --port $PORT --user $USER --password $PASS --ru=false`
echo $LIST_JOB_OUTPUT
if echo $LIST_JOB_OUTPUT | grep -q $JOBID1
then
   echo "First job ID $JOBID1 found"
else
   echo "Could not find first job ID $JOBID1"
   exit 1
fi

if echo $LIST_JOB_OUTPUT | grep -q $JOBID2
then
   echo "Second job ID $JOBID2 found"
else
   echo "Could not find second job ID $JOBID2"
   exit 1
fi

# Echo both job IDs for later retrieval
echo "Submitted jobs: $JOBID1 $JOBID2"