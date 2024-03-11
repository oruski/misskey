#!/bin/bash

set -xe

sudo chown -R node /workspace
git submodule update --init
npm ci
cp .devcontainer/devcontainer.yml .config/default.yml
npm run build
npm run migrate
