#!/bin/bash

zowe zos-files edit uss "/z/user/hello.c" --bogus-flag
exit $?
