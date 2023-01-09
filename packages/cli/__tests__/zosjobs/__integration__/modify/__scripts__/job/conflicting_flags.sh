#!/bin/bash

zowe zos-jobs modify job JOB00000 --hold --release
exit $?