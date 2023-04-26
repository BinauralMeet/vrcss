#!/bin/sh
yarn build
cd build
scp -r * binaural.me:/home/WWW/docroots/vrc/
