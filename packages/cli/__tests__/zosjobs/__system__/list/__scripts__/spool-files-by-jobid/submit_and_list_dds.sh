#!/bin/bash
# Submit the job and ensure the RC is 0
JOBID="$(zowe jobs submit ds "$1" --rff jobid --rft string)"
CMDRC=$?
if [ $CMDRC -gt 0 ]
then
    echo $JOBID 1>&2
    echo "Submit returned a non-zero return code" 1>&2
    exit $CMDRC
fi

# Echo the JOBID for retrieval in tests
echo "Submitted job ID: $JOBID"

# Loop until the status is output
STATUS=""
while [ "$STATUS" != "OUTPUT" ]; do
    STATUS="$(zowe zos-jobs view job-status-by-jobid $JOBID --rff status --rft string)"
    RC=$?
    if [ $RC -gt 0 ]
    then
        echo $STATUS 1>&2
        echo "The submit data set command returned a non-zero return code: $RC" 1>&2
        exit $RC
    fi
done

zowe zos-jobs list spool-files-by-jobid $JOBID
exit $?