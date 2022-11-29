#!/bin/bash

zowe zos-jobs modify job JOB00000 --jobclass A
RC=$?

exit $?
