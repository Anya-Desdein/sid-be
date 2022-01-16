#!/bin/bash

# https://stackoverflow.com/a/1482133
SCRIPT_DIR=$(dirname "$(readlink -f "$0")")
cd "$SCRIPT_DIR/../sid-api"

node .
