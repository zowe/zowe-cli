#!/bin/bash
# TODO - delete the job from spool
# Submit the job and ensure the RC is 0
JOBID="$(zowe jobs submit ds "$1" --rff jobid --rft string)"
CMDRC=$?
if [ $CMDRC -gt 0 ]
then
    echo $JOBID 1>&2
    echo "Submit returned a non-zero return code" 1>&2
    exit $CMDRC
fi

# Loop until the status is output
STATUS=""
while [ "$STATUS" != "OUTPUT" ]; do 
    
    # get the status
    STATUS="$(zowe zos-jobs view job-status-by-jobid $JOBID --rff status --rft string)"
    RC=$?
    if [ $RC -gt 0 ]
    then
        echo $STATUS 1>&2
        echo "The view job status command returned a non-zero rc: $RC" 1>&2
        exit $RC
    fi
done 

# Obtain all the spool files
SPOOL_FILES="$(zowe zos-jobs list spool-files-by-jobid $JOBID --rff jobid id --rft table)"
RC=$?
if [ $RC -gt 0 ]
then
    echo $SPOOL_FILES 1>&2
    echo "The list spool files command returned a non-zero rc: $RC" 1>&2
    exit $RC
fi

# Print the content for each file
IFS='
'
for FILE in $SPOOL_FILES; do
    echo "${FILE}" | IFS=' ' read -a ARRAY
    echo "*********************************************************************"
    echo "*   !!!SPOOL FILE ${ARRAY[1]}!!!"
    echo "*********************************************************************"
    zowe jobs vw sfbi ${ARRAY[0]} ${ARRAY[1]}
    RC=$?
    if [ $RC -gt 0 ]
    then
        echo $STATUS 1>&2
        echo "The view spool file by id command returned a non-zero rc: $RC" 1>&2
        exit $RC
    fi
done
