#!/bin/bash
zowe zos-jobs view job-status-by-jobid "JOB123" blah --host fakehost --user fakeuser --pass fakepass
exit $?