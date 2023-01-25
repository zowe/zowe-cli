#!/bin/bash

zowe zos-jobs download output JOB1234 --binary --record
exit $?
