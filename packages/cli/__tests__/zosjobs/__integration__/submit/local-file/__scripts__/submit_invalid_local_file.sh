#!/bin/bash
 zowe zos-jobs submit local-file "noFileHere" --host fakehost --user fakeuser --password fakeuser
 exit $?
