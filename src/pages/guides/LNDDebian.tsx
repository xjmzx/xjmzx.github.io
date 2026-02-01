import { useSeoMeta } from '@unhead/react';
import { 
  GuideLayout, 
  GuideSection, 
  CodeBlock, 
  ConfigFile, 
  InfoBox, 
  WarningBox, 
  CommandBox,
  RequirementsTable 
} from '@/components/GuideLayout';

export default function LNDDebian() {
  useSeoMeta({
    title: 'LND Setup Guide - Debian LTS',
    description: 'Complete guide for setting up LND (Lightning Network Daemon) on Debian LTS with minimal overhead for VPS deployment.',
  });

  const requirements = [
    { component: 'RAM', minimum: '2 GB', recommended: '4 GB+' },
    { component: 'Storage', minimum: '50 GB SSD', recommended: '100 GB+ SSD' },
    { component: 'CPU', minimum: '2 cores', recommended: '4 cores+' },
    { component: 'Bandwidth', minimum: '500 GB/month', recommended: 'Unlimited' },
  ];

  return (
    <GuideLayout
      title="LND Setup Guide"
      description="Complete guide for setting up LND (Lightning Network Daemon) on Debian LTS with ThunderHub, LNDG, and Balance of Satoshis. Optimized for minimal VPS overhead with pruned Bitcoin backend."
      os="Debian"
      daemon="LND"
    >
      <GuideSection title="Prerequisites">
        <WarningBox>
          This guide assumes a fresh Debian LTS installation on a VPS. Always backup your data before proceeding.
        </WarningBox>

        <h3 className="text-xl font-semibold mt-6 mb-3">System Requirements</h3>
        <RequirementsTable requirements={requirements} />

        <InfoBox>
          With a pruned Bitcoin backend (5 GB), the storage requirement is significantly reduced. 
          The initial blockchain download will still require substantial bandwidth and time.
        </InfoBox>

        <h3 className="text-xl font-semibold mt-6 mb-3">Swap Memory</h3>
        <p>For VPS instances with 2-4 GB RAM, configure swap space to prevent out-of-memory errors during initial blockchain sync:</p>
        <CodeBlock>
{`# Check current swap
free -h

# Create 4GB swap file
sudo fallocate -l 4G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile

# Make swap permanent
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab

# Verify swap is active
free -h`}
        </CodeBlock>
      </GuideSection>

      <GuideSection title="Initial System Setup">
        <h3 className="text-xl font-semibold mb-3">Update System</h3>
        <CodeBlock>
{`# Update package lists and upgrade system
sudo apt update && sudo apt upgrade -y

# Install essential packages
sudo apt install -y curl wget git build-essential ufw fail2ban`}
        </CodeBlock>

        <h3 className="text-xl font-semibold mt-6 mb-3">Install ZSH (Optional)</h3>
        <CodeBlock>
{`# Install ZSH
sudo apt install -y zsh

# Install Oh My Zsh (optional but recommended)
sh -c "$(curl -fsSL https://raw.githubusercontent.com/ohmyzsh/ohmyzsh/master/tools/install.sh)"

# Set ZSH as default shell
chsh -s $(which zsh)`}
        </CodeBlock>

        <h3 className="text-xl font-semibold mt-6 mb-3">Configure Firewall</h3>
        <CodeBlock>
{`# Allow SSH (change 22 if using custom port)
sudo ufw allow 22/tcp

# Allow Bitcoin P2P
sudo ufw allow 8333/tcp

# Allow Lightning P2P
sudo ufw allow 9735/tcp

# Enable firewall
sudo ufw enable
sudo ufw status`}
        </CodeBlock>

        <h3 className="text-xl font-semibold mt-6 mb-3">Hardware Key SSH Authentication</h3>
        <WarningBox>
          Setting up hardware key authentication requires a YubiKey or similar device. 
          Keep password authentication enabled until hardware key is fully tested.
        </WarningBox>
        
        <CodeBlock>
{`# Install required packages
sudo apt install -y libpam-u2f

# Generate hardware key configuration (on client machine)
pamu2fcfg > ~/.config/Yubico/u2f_keys

# Copy to server
scp ~/.config/Yubico/u2f_keys user@server:~/.config/Yubico/

# Configure PAM (edit /etc/pam.d/sshd)
# Add this line after @include common-auth:
# auth required pam_u2f.so

# Configure SSH (edit /etc/ssh/sshd_config)
# Ensure these settings:
# ChallengeResponseAuthentication yes
# UsePAM yes

# Restart SSH
sudo systemctl restart sshd`}
        </CodeBlock>
      </GuideSection>

      <GuideSection title="Install Docker">
        <p>Docker is required for LNDG and other containerized services.</p>
        <CodeBlock>
{`# Remove old Docker versions
sudo apt remove docker docker-engine docker.io containerd runc

# Install dependencies
sudo apt install -y ca-certificates curl gnupg lsb-release

# Add Docker's official GPG key
sudo mkdir -p /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/debian/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg

# Set up Docker repository
echo \\
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/debian \\
  $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Install Docker Engine
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# Add user to docker group
sudo usermod -aG docker $USER

# Verify installation
docker --version
docker compose version`}
        </CodeBlock>
        <InfoBox>
          Log out and back in for group membership to take effect.
        </InfoBox>
      </GuideSection>

      <GuideSection title="Install Tor">
        <p>Tor enables hidden service access to your node, improving privacy and allowing connection without exposing your IP.</p>
        <CodeBlock>
{`# Install Tor
sudo apt install -y tor

# Start and enable Tor
sudo systemctl enable tor
sudo systemctl start tor

# Verify Tor is running
sudo systemctl status tor`}
        </CodeBlock>

        <h3 className="text-xl font-semibold mt-6 mb-3">Configure Tor</h3>
        <p>Edit <code>/etc/tor/torrc</code> to enable hidden services:</p>
        <CodeBlock>
{`sudo nano /etc/tor/torrc

# Add these lines:
ControlPort 9051
CookieAuthentication 1
CookieAuthFileGroupReadable 1`}
        </CodeBlock>

        <CodeBlock>
{`# Restart Tor
sudo systemctl restart tor

# Add your user to the debian-tor group
sudo usermod -aG debian-tor $USER`}
        </CodeBlock>
      </GuideSection>

      <GuideSection title="Install Bitcoin Core">
        <h3 className="text-xl font-semibold mb-3">Download and Verify</h3>
        <CodeBlock>
{`# Create bitcoin user and directories
sudo adduser --disabled-password --gecos "" bitcoin
sudo mkdir -p /data/bitcoin
sudo chown bitcoin:bitcoin /data/bitcoin

# Download Bitcoin Core (check bitcoincore.org for latest version)
cd /tmp
wget https://bitcoincore.org/bin/bitcoin-core-27.0/bitcoin-27.0-x86_64-linux-gnu.tar.gz
wget https://bitcoincore.org/bin/bitcoin-core-27.0/SHA256SUMS
wget https://bitcoincore.org/bin/bitcoin-core-27.0/SHA256SUMS.asc

# Verify checksums
sha256sum --ignore-missing --check SHA256SUMS

# Import Bitcoin Core signing keys
wget https://bitcoincore.org/keys/builder-keys.asc
gpg --import builder-keys.asc

# Verify signatures
gpg --verify SHA256SUMS.asc

# Extract and install
tar -xvf bitcoin-27.0-x86_64-linux-gnu.tar.gz
sudo install -m 0755 -o root -g root -t /usr/local/bin bitcoin-27.0/bin/*`}
        </CodeBlock>

        <h3 className="text-xl font-semibold mt-6 mb-3">Configure Bitcoin</h3>
        <ConfigFile filename="/data/bitcoin/bitcoin.conf">
{`# [Prune and minimal overhead]
mempoolexpiry=48
maxmempool=250
maxorphantx=4
maxsigcachesize=4
dbcache=500

# Prune (do not change)
prune=5000

# Set for IBD (initial block download) - remove after sync
#blocksonly=1

# [debug and log]
debug=rpc
deprecatedrpc=warnings
shrinkdebuglog=1

# DO NOT Relay non-P2SH multisig tx
permitbaremultisig=0

# [network]
maxconnections=8
maxoutboundconnections=8
maxuploadtarget=500
peerbloomfilters=0
nopeerbloomfilters=1
listen=0

# [rpc]
server=1
rpcport=8332
rpcallowip=127.0.0.1
rpcallowip=127.0.0.1/24
rpcconnect=127.0.0.1
txindex=0
rpccookiefile=/data/bitcoin/.cookie

# [wallet]
disablewallet=1

# [zeromq]
zmqpubrawblock=tcp://0.0.0.0:28332
zmqpubrawtx=tcp://0.0.0.0:28333

# [enable tor]
proxy=127.0.0.1:9050
#onlynet=onion
#onlynet=ipv4,ipv6`}
        </ConfigFile>

        <h3 className="text-xl font-semibold mt-6 mb-3">Create Systemd Service</h3>
        <ConfigFile filename="/etc/systemd/system/bitcoind.service">
{`[Unit]
Description=Bitcoin daemon
After=network.target

[Service]
ExecStart=/usr/local/bin/bitcoind -conf=/data/bitcoin/bitcoin.conf -datadir=/data/bitcoin
User=bitcoin
Group=bitcoin
Type=simple
Restart=on-failure
RestartSec=30
TimeoutStopSec=600

[Install]
WantedBy=multi-user.target`}
        </ConfigFile>

        <CodeBlock>
{`# Set permissions
sudo chown bitcoin:bitcoin /data/bitcoin/bitcoin.conf

# Enable and start bitcoind
sudo systemctl enable bitcoind
sudo systemctl start bitcoind

# Monitor initial sync (this will take several hours to days)
sudo tail -f /data/bitcoin/debug.log

# Check sync status
bitcoin-cli -datadir=/data/bitcoin getblockchaininfo`}
        </CodeBlock>

        <InfoBox>
          Initial blockchain download can take 24-72 hours depending on your connection speed. 
          The node will prune blocks automatically to maintain ~5 GB storage.
        </InfoBox>
      </GuideSection>

      <GuideSection title="Install LND">
        <h3 className="text-xl font-semibold mb-3">Download LND</h3>
        <CodeBlock>
{`# Create LND user and directories
sudo adduser --disabled-password --gecos "" lnd
sudo mkdir -p /data/lnd
sudo chown lnd:lnd /data/lnd

# Download LND (check github.com/lightningnetwork/lnd for latest)
cd /tmp
wget https://github.com/lightningnetwork/lnd/releases/download/v0.18.0-beta/lnd-linux-amd64-v0.18.0-beta.tar.gz
wget https://github.com/lightningnetwork/lnd/releases/download/v0.18.0-beta/manifest-v0.18.0-beta.txt
wget https://github.com/lightningnetwork/lnd/releases/download/v0.18.0-beta/manifest-v0.18.0-beta.sig

# Verify signatures
wget https://raw.githubusercontent.com/lightningnetwork/lnd/master/scripts/keys/roasbeef.asc
gpg --import roasbeef.asc
gpg --verify manifest-v0.18.0-beta.sig manifest-v0.18.0-beta.txt

# Verify checksums
sha256sum --ignore-missing --check manifest-v0.18.0-beta.txt

# Extract and install
tar -xvf lnd-linux-amd64-v0.18.0-beta.tar.gz
sudo install -m 0755 -o root -g root -t /usr/local/bin lnd-linux-amd64-v0.18.0-beta/*`}
        </CodeBlock>

        <h3 className="text-xl font-semibold mt-6 mb-3">Configure LND</h3>
        <WarningBox>
          Before starting LND, you need to create a wallet password file. Store this password securely!
        </WarningBox>

        <CodeBlock>
{`# Create password file (replace YOUR_SECURE_PASSWORD)
echo "YOUR_SECURE_PASSWORD" | sudo -u lnd tee /data/lnd/p.txt
sudo chmod 400 /data/lnd/p.txt`}
        </CodeBlock>

        <ConfigFile filename="/data/lnd/lnd.conf">
{`[Application Options]
debuglevel=PEER=info
debuglevel=BTCN=warn
maxpendingchannels=8
maxlogfiles=5
alias=my_node_alias
accept-amp=true
accept-keysend=true
color=#008030
minchansize=2500
maxchansize=50000000
default-remote-max-htlcs=25
protocol.wumbo-channels=1
accept-amp=true
maxbackoff=8m
stagger-initial-reconnect=true
gc-canceled-invoices-on-the-fly=true
ignore-historical-gossip-filters=1

chan-enable-timeout=10m
chan-disable-timeout=12m

#externalip=YOUR.IP.ADDRESS.HERE:9735
nat=false
rpclisten=0.0.0.0:10009
restlisten=0.0.0.0:8080
listen=0.0.0.0:9735

dust-threshold=1000000
max-commit-fee-rate-anchors=200
coop-close-target-confs=8
coin-selection-strategy=largest
wallet-unlock-password-file=/data/lnd/p.txt

tlscertpath=/data/lnd/tls.cert
tlskeypath=/data/lnd/tls.key
tlsautorefresh=true
tlsdisableautofill=1

[Bitcoin]
bitcoin.mainnet=1
bitcoin.node=bitcoind
bitcoin.basefee=50
bitcoin.feerate=500
bitcoin.defaultchanconfs=3
bitcoin.timelockdelta=144

[Bitcoind]
bitcoind.dir=/data/bitcoin
bitcoind.rpchost=127.0.0.1:8332
bitcoind.zmqpubrawblock=tcp://127.0.0.1:28332
bitcoind.zmqpubrawtx=tcp://127.0.0.1:28333
bitcoind.rpccookie=/data/bitcoin/.cookie
bitcoind.estimatemode=ECONOMICAL

[routerrpc]
routerrpc.attemptcost=5
routerrpc.attemptcostppm=50
routerrpc.maxmchistory=900
routerrpc.minrtprob=0.01

[tor]
tor.active=1
tor.socks=127.0.0.1:9050
tor.v3=true
tor.privatekeypath=/data/lnd/v3_onion_private_key
tor.streamisolation=false
tor.skip-proxy-for-clearnet-targets=true

[bolt]
db.bolt.auto-compact=true
db.bolt.auto-compact-min-age=240h`}
        </ConfigFile>

        <h3 className="text-xl font-semibold mt-6 mb-3">Create Systemd Service</h3>
        <ConfigFile filename="/etc/systemd/system/lnd.service">
{`[Unit]
Description=LND Lightning Network Daemon
Requires=bitcoind.service
After=bitcoind.service

[Service]
ExecStart=/usr/local/bin/lnd --lnddir=/data/lnd
User=lnd
Group=lnd
Type=simple
Restart=on-failure
RestartSec=30
TimeoutStopSec=600

[Install]
WantedBy=multi-user.target`}
        </ConfigFile>

        <CodeBlock>
{`# Set permissions
sudo chown lnd:lnd /data/lnd/lnd.conf
sudo chown lnd:lnd /data/lnd/p.txt

# Enable and start LND
sudo systemctl enable lnd
sudo systemctl start lnd

# Wait for LND to start, then initialize wallet
# If this is a new wallet:
sudo -u lnd lncli --lnddir=/data/lnd create

# If restoring from seed:
sudo -u lnd lncli --lnddir=/data/lnd create

# Check status
sudo systemctl status lnd
sudo -u lnd lncli --lnddir=/data/lnd getinfo`}
        </CodeBlock>

        <InfoBox>
          During wallet creation, you'll receive a 24-word seed phrase. Write this down and store it securely offline. 
          This is the ONLY way to recover your funds if something goes wrong.
        </InfoBox>
      </GuideSection>

      <GuideSection title="Install ThunderHub">
        <p>ThunderHub is a web-based Lightning node manager with a clean interface.</p>
        
        <CodeBlock>
{`# Install Node.js (required for ThunderHub)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Clone ThunderHub
cd /home/lnd
sudo -u lnd git clone https://github.com/apotdevin/thunderhub.git
cd thunderhub

# Install dependencies and build
sudo -u lnd npm install
sudo -u lnd npm run build`}
        </CodeBlock>

        <h3 className="text-xl font-semibold mt-6 mb-3">Configure ThunderHub</h3>
        <ConfigFile filename="/home/lnd/thunderhub/.env.local">
{`# Server Configuration
PORT=3000
NODE_ENV=production

# Account Configuration
ACCOUNT_CONFIG_PATH=/home/lnd/thunderhub/accounts.yaml`}
        </ConfigFile>

        <ConfigFile filename="/home/lnd/thunderhub/accounts.yaml">
{`masterPassword: 'CHANGE_THIS_PASSWORD'
accounts:
  - name: 'My Node'
    serverUrl: '127.0.0.1:10009'
    macaroonPath: '/data/lnd/data/chain/bitcoin/mainnet/admin.macaroon'
    certificatePath: '/data/lnd/tls.cert'`}
        </ConfigFile>

        <h3 className="text-xl font-semibold mt-6 mb-3">Create Systemd Service</h3>
        <ConfigFile filename="/etc/systemd/system/thunderhub.service">
{`[Unit]
Description=ThunderHub
Requires=lnd.service
After=lnd.service

[Service]
WorkingDirectory=/home/lnd/thunderhub
ExecStart=/usr/bin/npm run start
User=lnd
Restart=always
RestartSec=30

[Install]
WantedBy=multi-user.target`}
        </ConfigFile>

        <CodeBlock>
{`# Enable and start ThunderHub
sudo systemctl enable thunderhub
sudo systemctl start thunderhub
sudo systemctl status thunderhub`}
        </CodeBlock>

        <InfoBox>
          ThunderHub will be accessible at http://localhost:3000. 
          To access remotely, you'll need to set up Nginx with SSL (covered in next section).
        </InfoBox>
      </GuideSection>

      <GuideSection title="Install LNDG">
        <p>LNDG (LND Guide) is a comprehensive monitoring and management tool for LND nodes.</p>
        
        <CodeBlock>
{`# Create directory for LNDG
sudo mkdir -p /home/lnd/lndg
cd /home/lnd/lndg

# Create docker-compose.yml
sudo -u lnd tee docker-compose.yml << 'EOF'
version: '3.8'
services:
  lndg:
    image: cryptosharks131/lndg:latest
    container_name: lndg
    restart: always
    volumes:
      - /data/lnd:/root/.lnd:ro
      - ./data:/lndg/data
    ports:
      - "8889:8889"
    environment:
      - LND_NETWORK=mainnet
      - LND_DIR=/root/.lnd
EOF`}
        </CodeBlock>

        <CodeBlock>
{`# Start LNDG
cd /home/lnd/lndg
docker compose up -d

# Check logs
docker compose logs -f

# Access LNDG
# First time setup at http://localhost:8889
# Default credentials: lndg-admin / lndg-admin (change immediately)`}
        </CodeBlock>

        <WarningBox>
          Change the default LNDG password immediately after first login!
        </WarningBox>
      </GuideSection>

      <GuideSection title="Install Balance of Satoshis">
        <p>Balance of Satoshis (bos) is a powerful command-line tool for Lightning node management.</p>
        
        <CodeBlock>
{`# Install bos globally
sudo npm install -g balanceofsatoshis

# Create bos directory structure
sudo mkdir -p /home/lnd/.bos
sudo chown lnd:lnd /home/lnd/.bos

# Configure bos for LND
sudo -u lnd tee /home/lnd/.bos/default/credentials.json << 'EOF'
{
  "cert": "/data/lnd/tls.cert",
  "macaroon": "/data/lnd/data/chain/bitcoin/mainnet/admin.macaroon",
  "socket": "127.0.0.1:10009"
}
EOF

# Test bos
sudo -u lnd bos balance`}
        </CodeBlock>

        <InfoBox>
          Useful bos commands: <code>bos balance</code>, <code>bos fees</code>, <code>bos rebalance</code>, <code>bos forwards</code>
        </InfoBox>
      </GuideSection>

      <GuideSection title="Install Nginx with SSL">
        <p>Set up Nginx as a reverse proxy with SSL for secure remote access to ThunderHub and LNDG.</p>
        
        <CodeBlock>
{`# Install Nginx and Certbot
sudo apt install -y nginx certbot python3-certbot-nginx

# Create Nginx configuration for ThunderHub
sudo tee /etc/nginx/sites-available/thunderhub << 'EOF'
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF

# Create Nginx configuration for LNDG
sudo tee /etc/nginx/sites-available/lndg << 'EOF'
server {
    listen 80;
    server_name lndg.your-domain.com;

    location / {
        proxy_pass http://localhost:8889;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF

# Enable sites
sudo ln -s /etc/nginx/sites-available/thunderhub /etc/nginx/sites-enabled/
sudo ln -s /etc/nginx/sites-available/lndg /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx

# Obtain SSL certificates (replace with your domains)
sudo certbot --nginx -d your-domain.com
sudo certbot --nginx -d lndg.your-domain.com

# Allow HTTPS through firewall
sudo ufw allow 'Nginx Full'`}
        </CodeBlock>

        <WarningBox>
          Replace <code>your-domain.com</code> and <code>lndg.your-domain.com</code> with your actual domain names. 
          Ensure DNS records point to your server's IP address before running certbot.
        </WarningBox>
      </GuideSection>

      <GuideSection title="Maintenance & Monitoring">
        <h3 className="text-xl font-semibold mb-3">Useful Commands</h3>
        <CodeBlock>
{`# Check service status
sudo systemctl status bitcoind
sudo systemctl status lnd
sudo systemctl status thunderhub

# View logs
sudo journalctl -u bitcoind -f
sudo journalctl -u lnd -f
sudo journalctl -u thunderhub -f

# LND commands
sudo -u lnd lncli --lnddir=/data/lnd getinfo
sudo -u lnd lncli --lnddir=/data/lnd walletbalance
sudo -u lnd lncli --lnddir=/data/lnd channelbalance
sudo -u lnd lncli --lnddir=/data/lnd listchannels

# Bitcoin commands
bitcoin-cli -datadir=/data/bitcoin getblockchaininfo
bitcoin-cli -datadir=/data/bitcoin getnetworkinfo`}
        </CodeBlock>

        <h3 className="text-xl font-semibold mt-6 mb-3">Backup Strategy</h3>
        <WarningBox>
          Regular backups are critical for Lightning nodes. Loss of channel state can result in loss of funds.
        </WarningBox>
        
        <CodeBlock>
{`# Backup LND data (run regularly, ideally automated)
sudo -u lnd lncli --lnddir=/data/lnd exportchanbackup > ~/channel-backup-$(date +%Y%m%d).backup

# Backup critical files
tar -czf lnd-backup-$(date +%Y%m%d).tar.gz \\
  /data/lnd/data/chain/bitcoin/mainnet/channel.backup \\
  /data/lnd/lnd.conf

# Store backups securely off-server`}
        </CodeBlock>

        <h3 className="text-xl font-semibold mt-6 mb-3">Updates</h3>
        <CodeBlock>
{`# Update Bitcoin Core
# 1. Download new version
# 2. Stop bitcoind: sudo systemctl stop bitcoind
# 3. Install new binaries
# 4. Start bitcoind: sudo systemctl start bitcoind

# Update LND
# 1. Download new version
# 2. Stop lnd: sudo systemctl stop lnd
# 3. Install new binaries
# 4. Start lnd: sudo systemctl start lnd

# Update ThunderHub
cd /home/lnd/thunderhub
sudo -u lnd git pull
sudo -u lnd npm install
sudo -u lnd npm run build
sudo systemctl restart thunderhub

# Update LNDG
cd /home/lnd/lndg
docker compose pull
docker compose up -d`}
        </CodeBlock>
      </GuideSection>

      <GuideSection title="Troubleshooting">
        <h3 className="text-xl font-semibold mb-3">Common Issues</h3>
        
        <div className="space-y-4">
          <div className="border-l-4 border-primary pl-4">
            <h4 className="font-semibold mb-2">Bitcoin not syncing</h4>
            <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
              <li>Check disk space: <code>df -h</code></li>
              <li>Verify Tor is running: <code>sudo systemctl status tor</code></li>
              <li>Check firewall: <code>sudo ufw status</code></li>
              <li>Review logs: <code>tail -f /data/bitcoin/debug.log</code></li>
            </ul>
          </div>

          <div className="border-l-4 border-primary pl-4">
            <h4 className="font-semibold mb-2">LND won't start</h4>
            <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
              <li>Ensure Bitcoin is fully synced</li>
              <li>Check password file permissions: <code>ls -la /data/lnd/p.txt</code></li>
              <li>Verify configuration: <code>sudo -u lnd lnd --lnddir=/data/lnd --debuglevel=debug</code></li>
              <li>Check logs: <code>sudo journalctl -u lnd -n 100</code></li>
            </ul>
          </div>

          <div className="border-l-4 border-primary pl-4">
            <h4 className="font-semibold mb-2">Can't access ThunderHub/LNDG</h4>
            <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
              <li>Verify services are running: <code>sudo systemctl status thunderhub</code></li>
              <li>Check Nginx configuration: <code>sudo nginx -t</code></li>
              <li>Verify firewall rules: <code>sudo ufw status</code></li>
              <li>Check SSL certificates: <code>sudo certbot certificates</code></li>
            </ul>
          </div>

          <div className="border-l-4 border-primary pl-4">
            <h4 className="font-semibold mb-2">Low memory / OOM errors</h4>
            <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
              <li>Verify swap is active: <code>free -h</code></li>
              <li>Reduce Bitcoin dbcache in bitcoin.conf</li>
              <li>Limit Docker container resources</li>
              <li>Consider upgrading VPS RAM</li>
            </ul>
          </div>
        </div>
      </GuideSection>

      <GuideSection title="Next Steps">
        <ul className="space-y-2">
          <li className="flex items-start gap-2">
            <span className="text-primary mt-1">→</span>
            <span>Fund your Lightning wallet and open channels</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary mt-1">→</span>
            <span>Configure automated backups with cron</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary mt-1">→</span>
            <span>Set up monitoring alerts (Prometheus + Grafana)</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary mt-1">→</span>
            <span>Explore bos rebalancing strategies</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary mt-1">→</span>
            <span>Join the Lightning Network community on Telegram/Discord</span>
          </li>
        </ul>
      </GuideSection>
    </GuideLayout>
  );
}
