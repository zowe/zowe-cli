#!/bin/bash
zowe zos-jobs view job-status-by-jobid $1 --rfj
exit $?
