#!/bin/sh

gcloud compute --project "sunlit-realm-131518" ssh --zone "us-central1-b" openreview@openreview-web-1 --command 'cd bin && ./deploy-web.sh' --quiet
