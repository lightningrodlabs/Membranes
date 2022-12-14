#!/bin/bash

zits -i crates/membranes_types -i crates/membranes_integrity -i crates/membranes -o webcomponents/src/bindings/membranes.ts

zits --default-zome-name zTasker -i playground/zomes/tasker -i playground/zomes/tasker_model -o playground/webapp/src/bindings/tasker.ts
