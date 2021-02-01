#!/bin/bash
set -e

zowe zos-console collect sync-responses
exit $?
