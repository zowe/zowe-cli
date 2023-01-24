#!/bin/bash

zowe zos-files compare ds "AT895452.TESTING.JCL(ECONTXTL)" "AT895452.TESTING.JCL(CONTXTLN)" --bogus-flag
exit $?
