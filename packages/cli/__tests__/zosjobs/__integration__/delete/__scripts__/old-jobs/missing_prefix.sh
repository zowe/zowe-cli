#!/bin/bash

zowe zos-jobs delete old-jobs --prefix
exit $?
