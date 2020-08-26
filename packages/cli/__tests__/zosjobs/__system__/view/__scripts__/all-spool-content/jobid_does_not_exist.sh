#!/bin/bash

zowe zos-jobs view all-spool-content JOB00000
exit $?
