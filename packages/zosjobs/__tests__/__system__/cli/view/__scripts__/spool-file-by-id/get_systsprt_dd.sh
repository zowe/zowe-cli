#!/bin/bash
# TODO - delete the job from spool
# Job id passed as input
JOBID=$1

# Obtain all the spool files
SPOOL_FILES="$(zowe zos-jobs list spool-files-by-jobid $JOBID --rff ddname id --rft table)"
RC=$?
if [ $RC -gt 0 ]
then
    echo $SPOOL_FILES 1>&2
    echo "The list spool files command returned a non-zero rc: $RC" 1>&2
    exit $RC
fi

echo "$SPOOL_FILES"

# Print the content for each file
IFS='
'
for FILE in $SPOOL_FILES; do
    if [[ $FILE = *"SYSTSPRT"* ]]
    then 
        echo "*********************************************************************"
        echo "*   !!!SPOOL FILE!!!"
        echo "*********************************************************************"
        SPOOLID=${FILE//"SYSTSPRT"/}
        SPOOLID=${SPOOLID//[[:space:]]/}
        zowe jobs vw sfbi $JOBID $SPOOLID
        RC=$?
        if [ $RC -gt 0 ]
        then
            echo $STATUS 1>&2
            echo "The view spool file by id command returned a non-zero rc: $RC" 1>&2
            exit $RC
        fi
    fi
done
