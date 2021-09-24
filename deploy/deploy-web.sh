#!/bin/sh

instance_prefix='openreview-web-'

nginx='nginx'

nvm='export NVM_DIR="$HOME/.nvm" && [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh" &&'

instances=$(gcloud compute instances list | grep "$instance_prefix" | grep RUNNING | tr -s ' ' | cut -d' ' -f1,2)

instances_arr=(${instances// / })

instance_names=()
zones=()
for i in ${!instances_arr[@]}; do
  if echo "${instances_arr[$i]}" | grep -q "$instance_prefix"; then
    instance_names+=(${instances_arr[$i]})
  else
    zones+=(${instances_arr[$i]})
  fi
done

nginx=$(gcloud compute instances list | grep "$nginx" | grep RUNNING | tr -s ' ' | cut -d' ' -f1,2)

nginx_arr=(${nginx// / })
nginx_name=${nginx_arr[0]}
nginx_zone=${nginx_arr[1]}

pids=()
for i in ${!instance_names[@]}; do
  echo Deploying to ${instance_names[$i]}
  gcloud compute --project "sunlit-realm-131518" ssh --zone ${zones[$i]} openreview@${instance_names[$i]} --command "${nvm} bash bin/deploy-web.sh ${1}" &
  pids+=($!)
done

for pid in ${pids[@]}; do
  wait $pid
done

gcloud compute --project "sunlit-realm-131518" ssh --zone $nginx_zone openreview@$nginx_name --command "${nvm} bash bin/deploy.sh ${1}" --quiet
