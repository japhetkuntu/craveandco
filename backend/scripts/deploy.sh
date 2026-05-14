#!/usr/bin/env bash
set -euo pipefail

# Deploy backend changes to the remote droplet.
# Usage: ./deploy.sh <user@host>
# Example: ./deploy.sh root@203.0.113.45

if [ "$#" -ne 1 ]; then
  echo "Usage: $0 <user@host>"
  exit 1
fi

REMOTE="$1"
REMOTE_DIR="/var/www/crave-restaurant/backend"

ssh "$REMOTE" bash -lc "'
  set -euo pipefail
  cd $REMOTE_DIR
  git pull
  npm install
  export NODE_OPTIONS='--max-old-space-size=2048'
  npm run build
  sudo systemctl restart crave-api
  sudo systemctl status crave-api -l --no-pager
'"
