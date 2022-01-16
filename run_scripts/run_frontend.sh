#!/bin/bash

# https://stackoverflow.com/a/1482133
SCRIPT_DIR=$(dirname "$(readlink -f "$0")")

FRONTEND_PATH="$SCRIPT_DIR/../../sid-ed1-nuxt"
cd "$FRONTEND_PATH"

npm run dev 
