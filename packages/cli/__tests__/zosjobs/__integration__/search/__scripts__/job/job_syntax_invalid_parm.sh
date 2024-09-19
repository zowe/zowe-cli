#!/bin/bash
zowe zos-jobs search job "JOB123" blah --host fakehost --user fakeuser --password fakepass
exit $?