#!/bin/bash
wfName=$1
set -e

echo "================Z/OS WORKFLOWS ARCHIVE WORKFLOW NAME==========="

bright wf archive aw --wn $wfName
if [ $? -gt 0 ]
then
    exit $?
fi