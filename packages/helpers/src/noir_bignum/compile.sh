#!/bin/bash

wasm-pack build --target nodejs
cd ../../../../
npm i
cd -