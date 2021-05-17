gcloud compute instances create "$@" \
      --zone us-central1-b \
      --machine-type n2-standard-4 \
      --boot-disk-size 20GB \
      --boot-disk-type pd-ssd \
      --image-family ubuntu-2004-lts \
      --image-project ubuntu-os-cloud \
      --metadata-from-file startup-script=deploy/setup-openreview-web.sh

