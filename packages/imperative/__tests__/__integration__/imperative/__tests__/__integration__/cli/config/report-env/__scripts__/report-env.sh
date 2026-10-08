#!/bin/bash

FORCE_COLOR=0
# NPM registry must be set for test to verify that it appears in command output
npm_config_registry=https://registry.yarnpkg.com/

imperative-test-cli config report-env
exit $?*
