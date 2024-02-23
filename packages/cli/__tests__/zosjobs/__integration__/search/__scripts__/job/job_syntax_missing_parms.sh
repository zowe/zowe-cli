#!/bin/bash
zowe zos-jobs search job "job123" --host fakehost --user fakeuser --password fakepass
exit $?
