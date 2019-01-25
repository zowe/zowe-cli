#!/bin/bash
# TODO - delete the job from spool
# Submit the job and ensure the RC is 0
JOBID="$(bright jobs submit ds "$1" --rff jobid --rft string)"
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
    STATUS="$(bright zos-jobs view job-status-by-jobid $JOBID --rff status --rft string)"
    RC=$?
    if [ $RC -gt 0 ]
    then
        echo $STATUS 1>&2
        echo "The submit data set command returned a non-zero return code: $RC" 1>&2
        exit $RC
    fi
done 

bright zos-jobs list spool-files-by-jobid $JOBID
exit $?
