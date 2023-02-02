#!/bin/bash

zowe zos-files compare ds "IBMUSER.TESTING.JCL(ECONTXTL)" "IBMUSER.TESTING.JCL(CONTXTLN)" --bogus-flag
exit $?
