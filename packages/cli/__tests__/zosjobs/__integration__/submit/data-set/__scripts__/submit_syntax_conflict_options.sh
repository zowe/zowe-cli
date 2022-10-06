#!/bin/bash
zowe zos-jobs submit data-set "DATA.SET" --extension "./jcl"
exit $?
