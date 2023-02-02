#!/bin/bash

zits -i crates/membranes_types -i crates/membranes_integrity -i crates/membranes -o webcomponents/src/bindings/membranes.ts

zits --default-zome-name zThreshold_Vouch -i crates/threshold_Vouch_types -i crates/threshold_Vouch_integrity -i crates/threshold_Vouch -o webcomponents/src/bindings/vouch.ts
zits --default-zome-name zThreshold_CreateEntryCount -i crates/threshold_CreateEntryCount_types -i crates/threshold_CreateEntryCount_integrity -i crates/threshold_CreateEntryCount -o webcomponents/src/bindings/createEntryCount.ts

zits --default-zome-name zTasker -i playground/zomes/tasker -i playground/zomes/tasker_model -o playground/webapp/src/bindings/tasker.ts
