#!/usr/bin/env bash
 zowe zos-jobs submit local-file "noFileHere" --host fakehost --user fakeuser --pass fakeuser
 exit $?
