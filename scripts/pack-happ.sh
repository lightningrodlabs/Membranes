#!/bin/bash

# Compile the WASM
#cargo build --release --target wasm32-unknown-unknown
# test zome
hc dna pack --output=tasker.dna playground/workdir
hc app pack --output=tasker.happ playground/workdir
