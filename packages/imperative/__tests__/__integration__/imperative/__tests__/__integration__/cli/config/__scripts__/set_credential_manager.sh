#!/bin/bash

FORCE_COLOR=0

imperative-test-cli config set CredentialManager $1
exit $?
