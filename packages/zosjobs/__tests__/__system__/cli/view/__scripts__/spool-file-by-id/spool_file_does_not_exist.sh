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

# Attempt to get an ID for a spool file that doesn't exist
zowe jobs view spool-file-by-id $JOBID 9999
exit $?