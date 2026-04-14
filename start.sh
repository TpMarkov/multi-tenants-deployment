#!/bin/bash
export PATH="$PATH:/usr/local/bin:/opt/node/bin:$HOME/.nvm/versions/node/v20.11.0/bin"
command -v npm >/dev/null 2>&1 || { echo "npm not found, trying to locate..."; }
cd server
npm install
npm start