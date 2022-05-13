#!/usr/bin/env bash
zowe zos-jobs submit uss-file "/tmp/does/not/exist/at/all.txt"
exit $?