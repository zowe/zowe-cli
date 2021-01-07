#!/bin/bash
zowe zos-jobs submit data-set "DATA.SET" --wait-for-active --directory "./thisshouldgetasyntaxerror"
exit $?
