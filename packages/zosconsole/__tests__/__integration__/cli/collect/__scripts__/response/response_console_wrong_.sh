#!/bin/bash
set -e

zowe zos-console collect sync-responses C1234567 --cn 123@CA.COM
exit $?
