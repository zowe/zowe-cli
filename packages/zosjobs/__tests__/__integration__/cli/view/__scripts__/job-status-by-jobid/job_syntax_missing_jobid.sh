#!/bin/bash
zowe zos-jobs view job-status-by-jobid --host fakehost --user fakeuser --password fakepass
exit $?
