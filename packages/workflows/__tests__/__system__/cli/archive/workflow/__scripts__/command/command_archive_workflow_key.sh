#!/bin/bash
wfKey=$1
set -e

echo "================Z/OS WORKFLOWS ARCHIVE WORKFLOW KEY==========="

bright wf archive aw --wk $wfKey
if [ $? -gt 0 ]
then
    exit $?
fi