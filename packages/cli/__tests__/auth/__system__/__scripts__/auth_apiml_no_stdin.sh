#!/bin/bash


zowe zos-files list data-set "test.dataset.*" < /dev/null
exit $?
