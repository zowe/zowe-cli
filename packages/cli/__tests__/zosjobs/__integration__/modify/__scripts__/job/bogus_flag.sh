#!/bin/bash

zowe zos-jobs modify job $JOBID --bogus-flag
exit $?
