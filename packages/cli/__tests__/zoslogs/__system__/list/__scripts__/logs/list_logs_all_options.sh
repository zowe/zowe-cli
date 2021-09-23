#!/bin/bash
set -e

zowe zos-logs list logs --start-time 2021-07-26T03:38:37.098Z --range 5m --direction forward
exit $?
