#!/bin/bash
zowe zos-jobs view all-spool-content "JOB123" blah --host fakehost --user fakeuser --password fakepass
exit $?