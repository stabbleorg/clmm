#!/bin/bash
# Post-build script to add DynamicTickArray to IDL
# This runs after anchor build completes

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# Run the Node.js script to add DynamicTickArray to IDL
node "$SCRIPT_DIR/add-dynamic-tick-array-to-idl.js"

echo "✅ Post-build IDL update complete"
