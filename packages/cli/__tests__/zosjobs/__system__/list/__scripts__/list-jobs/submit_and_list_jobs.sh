#!/bin/bash
set -e

# arguments: $1 is a data set name with JCL inside to submit

JOBID1=`zowe zos-jobs submit data-set $1 --rff jobid --rft string`
JOBID2=`zowe zos-jobs submit data-set $1 --rff jobid --rft string`

echo "Listing jobs to find job IDs $JOBID1 and $JOBID2"

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
   echo "Could not find secon job ID $JOBID2"
   exit 1
fi