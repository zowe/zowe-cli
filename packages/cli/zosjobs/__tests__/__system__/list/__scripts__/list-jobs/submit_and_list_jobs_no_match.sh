#!/bin/bash
set -e

# arguments: $1 is a data set name with JCL inside to submit

JOBID1=`zowe zos-jobs submit data-set $1 --rff jobid --rft string`

echo "Listing jobs to find job IDs $JOBID1"

LIST_JOB_OUTPUT=`zowe zos-jobs list jobs -o FAKE* -p FAKE*`
if [[ $LIST_JOB_OUTPUT =~ $JOBID1 ]]
then
   echo "First job ID $JOBID1 found even though it was from a different owner"
   exit 1
else
   echo "No match - test passed"
fi
