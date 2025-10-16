#!/bin/bash

# Compile the WASM
#cargo build --release --target wasm32-unknown-unknown
# test zome
hc dna pack --output=artifacts/tasker.dna playground/workdir
hc app pack --output=artifacts/tasker.happ playground/workdir
