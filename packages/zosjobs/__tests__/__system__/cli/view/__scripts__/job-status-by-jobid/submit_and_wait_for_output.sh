#!/bin/bash

# TODO: Delete the job when commands become available

# Submit the command and get the JSON response with the JOBID field
JOBID=$(bright zos-jobs submit data-set "$1" --rff jobid --rft string)
RC=$?
if [ $RC -gt 0 ]
then
    echo "$JOBID" 1>&2
    echo "The submit data set command returned a non-zero return code: $RC"
    exit $RC
fi

# Loop until the status is output
STATUS=""
while [ "$STATUS" != "OUTPUT" ]; do 
    
    # get the status
    STATUS="$(bright zos-jobs view job-status-by-jobid $JOBID --rff status --rft string)"
   
    RC=$?
    if [ $RC -gt 0 ]
    then
        echo "$STATUS" 1>&2
        echo "The submit data set command returned a non-zero return code: $RC"
        exit $RC
    fi
done 

# echo the output 
echo $STATUS
