#!/bin/bash

# Submit the job and ensure the RC is 0
JOBID="$(zowe jobs submit ds "$1" --wfo true --rff jobid --rft string)"
CMDRC=$?
echo "Job ID: $JOBID"
if [ $CMDRC -gt 0 ]; then
    echo "Job submission failed with return code $CMDRC" 1>&2
    exit $CMDRC
fi

# Ensure the job ID is valid
if [ -z "$JOBID" ]; then
    echo "Job ID is empty, cannot proceed with the search." 1>&2
    exit 1
fi

# Wait for a few seconds to ensure job output is available
sleep 5

# Search the job's spool files
zowe jobs search job "$JOBID" --search-string "$3"
RC=$?
if [ $RC -gt 0 ]; then
    echo "The search spool job command returned a non-zero rc: $RC" 1>&2
    exit $RC
fi