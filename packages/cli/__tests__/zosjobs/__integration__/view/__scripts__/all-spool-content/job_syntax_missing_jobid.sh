#!/bin/bash
zowe zos-jobs view all-spool-content --host fakehost --user fakeuser --password fakepass
exit $?
