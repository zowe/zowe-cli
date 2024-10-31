#!/bin/bash
set -e

# Submit two jobs and capture their IDs
JOBID1=`zowe zos-jobs submit data-set $1 --rff jobid --rft string`
sleep 1
JOBID2=`zowe zos-jobs submit data-set $1 --rff jobid --rft string`

echo "Listing jobs to find job IDs $JOBID1 and $JOBID2"

sleep 1
LIST_JOB_OUTPUT=`zowe zos-jobs list jobs`
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