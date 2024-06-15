#!/bin/sh
yarn build
cd dist
scp -r * binaural.me:/home/WWW/docroots/vrc/