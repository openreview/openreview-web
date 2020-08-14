#! /bin/bash

# Run this command to see the progress: sudo journalctl -u google-startup-scripts.service
apt-get update
# Install Node version manager
sudo -u openreview bash -c 'cd ~/ && wget -qO- https://raw.githubusercontent.com/nvm-sh/nvm/v0.35.3/install.sh | bash'
# Install current Node version used in OpenReview
sudo -u openreview bash -c 'cd ~/ && export NVM_DIR="$HOME/.nvm" && [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh" && [ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion" && nvm install 14.5.0'
# Install PM2
sudo -u openreview bash -c 'cd ~/ && export NVM_DIR="$HOME/.nvm" && [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh" && [ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion" && npm install -g pm2'
# Create folder for OpenReview repo
sudo -u openreview bash -c 'mkdir -p /home/openreview/deploy'
# Create folder to store deploy script
sudo -u openreview bash -c 'mkdir -p /home/openreview/bin'
# Create folder to store production config
sudo -u openreview bash -c 'mkdir -p /home/openreview/conf'
# Install google sdk tools
sudo -u openreview bash -c 'echo "deb [signed-by=/usr/share/keyrings/cloud.google.gpg] https://packages.cloud.google.com/apt cloud-sdk main" | sudo tee -a /etc/apt/sources.list.d/google-cloud-sdk.list'
sudo -u openreview bash -c 'sudo apt-get install -y apt-transport-https ca-certificates gnupg'
sudo -u openreview bash -c 'curl https://packages.cloud.google.com/apt/doc/apt-key.gpg | sudo apt-key --keyring /usr/share/keyrings/cloud.google.gpg add -'
sudo -u openreview bash -c 'sudo apt-get -y update && sudo apt-get install -y google-cloud-sdk'
# Retrieve deploy and conf files
sudo -u openreview bash -c 'gsutil cp gs://openreview-files/conf/clone-web.sh /home/openreview/bin/'
sudo -u openreview bash -c 'gsutil cp gs://openreview-files/conf/deploy-web.sh /home/openreview/bin/'
# Clone
sudo -u openreview bash -c 'cd ~/ && export NVM_DIR="$HOME/.nvm" && [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh" && [ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion" && bash /home/openreview/bin/clone-web.sh'
# Create and start openreview service
sudo -u openreview bash -c 'gsutil cp gs://openreview-files/conf/openreview-web.service /home/openreview/bin/'
sudo -u openreview bash -c 'sudo cp /home/openreview/bin/openreview-web.service /lib/systemd/system'
sudo -u openreview bash -c 'cd ~/ && sudo systemctl daemon-reload'
sudo -u openreview bash -c 'cd ~/ && sudo systemctl start openreview-web'
sudo -u openreview bash -c 'cd ~/ && sudo systemctl enable openreview-web'
