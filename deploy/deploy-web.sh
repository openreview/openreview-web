#!/bin/sh

nvm='export NVM_DIR="$HOME/.nvm" && [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh" &&'

gcloud compute --project "sunlit-realm-131518" ssh --zone "us-central1-b" openreview@openreview-web-1 --command "${nvm} bash bin/deploy-web.sh ${1}" --quiet &

gcloud compute --project "sunlit-realm-131518" ssh --zone "us-central1-b" openreview@openreview-web-2 --command "${nvm} bash bin/deploy-web.sh ${1}" --quiet

gcloud compute --project "sunlit-realm-131518" ssh --zone "us-central1-b" openreview@instance-nginx --command "${nvm} bash bin/deploy.sh ${1}" --quiet
