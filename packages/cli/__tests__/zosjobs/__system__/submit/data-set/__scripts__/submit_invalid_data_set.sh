#!/bin/bash
zowe zos-jobs submit data-set "DOES.NOT.EXIST.AT.ALL(IEFBR14)"
exit $?