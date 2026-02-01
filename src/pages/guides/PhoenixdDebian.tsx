import { useSeoMeta } from '@unhead/react';
import { 
  GuideLayout, 
  GuideSection, 
  CodeBlock, 
  ConfigFile, 
  InfoBox, 
  WarningBox,
  RequirementsTable 
} from '@/components/GuideLayout';

export default function PhoenixdDebian() {
  useSeoMeta({
    title: 'phoenixd Setup Guide - Debian LTS',
    description: 'Minimal guide for setting up phoenixd Lightning daemon on Debian LTS with phoenixd-dashboard for VPS deployment.',
  });

  const requirements = [
    { component: 'RAM', minimum: '1 GB', recommended: '2 GB+' },
    { component: 'Storage', minimum: '30 GB SSD', recommended: '50 GB+ SSD' },
    { component: 'CPU', minimum: '1 core', recommended: '2 cores+' },
    { component: 'Bandwidth', minimum: '250 GB/month', recommended: '500 GB+' },
  ];

  return (
    <GuideLayout
      title="phoenixd Setup Guide"
      description="Minimal guide for setting up phoenixd Lightning daemon on Debian LTS with phoenixd-dashboard. Optimized for VPS deployment with reduced resource requirements compared to LND."
      os="Debian"
      daemon="phoenixd"
    >
      <GuideSection title="About phoenixd">
        <InfoBox>
          phoenixd is a self-custodial Lightning implementation by ACINQ (creators of Phoenix mobile wallet). 
          It offers automatic channel management, lower resource requirements than LND, and requires no manual liquidity management.
        </InfoBox>

        <h3 className="text-xl font-semibold mt-6 mb-3">System Requirements</h3>
        <RequirementsTable requirements={requirements} />

        <InfoBox>
          phoenixd has significantly lower resource requirements than LND because it doesn't require running a full Bitcoin node. 
          It connects to ACINQ's infrastructure for chain data.
        </InfoBox>
      </GuideSection>

      <GuideSection title="Prerequisites">
        <WarningBox>
          This guide assumes a fresh Debian LTS installation on a VPS. Always backup your data before proceeding.
        </WarningBox>

        <h3 className="text-xl font-semibold mt-6 mb-3">Swap Memory</h3>
        <p>For VPS instances with 1-2 GB RAM, configure swap space:</p>
        <CodeBlock>
{`# Check current swap
free -h

# Create 2GB swap file
sudo fallocate -l 2G /swapfile
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
sudo apt install -y curl wget git build-essential ufw fail2ban openjdk-21-jre`}
        </CodeBlock>

        <h3 className="text-xl font-semibold mt-6 mb-3">Install ZSH (Optional)</h3>
        <CodeBlock>
{`# Install ZSH
sudo apt install -y zsh

# Install Oh My Zsh
sh -c "$(curl -fsSL https://raw.githubusercontent.com/ohmyzsh/ohmyzsh/master/tools/install.sh)"

# Set ZSH as default shell
chsh -s $(which zsh)`}
        </CodeBlock>

        <h3 className="text-xl font-semibold mt-6 mb-3">Configure Firewall</h3>
        <CodeBlock>
{`# Allow SSH (change 22 if using custom port)
sudo ufw allow 22/tcp

# Allow phoenixd HTTP API (local only - will use Nginx for remote access)
# No firewall rules needed for phoenixd if using Nginx reverse proxy

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
        <p>Docker is required for phoenixd-dashboard and optional services.</p>
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
        <p>Tor enables privacy-enhanced Lightning payments and hidden service access.</p>
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
        <p>Edit <code>/etc/tor/torrc</code>:</p>
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

      <GuideSection title="Install phoenixd">
        <h3 className="text-xl font-semibold mb-3">Download phoenixd</h3>
        <CodeBlock>
{`# Create phoenixd user and directories
sudo adduser --disabled-password --gecos "" phoenixd
sudo mkdir -p /data/phoenixd
sudo chown phoenixd:phoenixd /data/phoenixd

# Download phoenixd (check github.com/ACINQ/phoenixd for latest version)
cd /tmp
wget https://github.com/ACINQ/phoenixd/releases/download/v0.7.2/phoenix-0.7.2-linux-x64.zip

# Extract
unzip phoenix-0.7.2-linux-x64.zip
cd phoenix-0.7.2-linux-x64

# Install to /usr/local/bin
sudo install -m 0755 -o root -g root phoenixd /usr/local/bin/phoenixd
sudo install -m 0755 -o root -g root phoenix-cli /usr/local/bin/phoenix-cli

# Verify installation
phoenixd --version`}
        </CodeBlock>

        <h3 className="text-xl font-semibold mt-6 mb-3">Configure phoenixd</h3>
        <InfoBox>
          phoenixd uses automatic configuration on first run. You can customize settings in the configuration file after initial setup.
        </InfoBox>

        <ConfigFile filename="/data/phoenixd/phoenix.conf">
{`# Network (mainnet or testnet)
chain=mainnet

# HTTP API
http-bind-ip=0.0.0.0
http-bind-port=9740

# Automatically create onchain address
auto-liquidity=true

# Tor settings (optional but recommended)
# socks5=127.0.0.1:9050

# Logging
log-level=INFO`}
        </ConfigFile>

        <h3 className="text-xl font-semibold mt-6 mb-3">Create Systemd Service</h3>
        <ConfigFile filename="/etc/systemd/system/phoenixd.service">
{`[Unit]
Description=phoenixd Lightning Daemon
After=network.target

[Service]
ExecStart=/usr/local/bin/phoenixd --data-dir=/data/phoenixd
User=phoenixd
Group=phoenixd
Type=simple
Restart=on-failure
RestartSec=30
TimeoutStopSec=120

[Install]
WantedBy=multi-user.target`}
        </ConfigFile>

        <CodeBlock>
{`# Set permissions
sudo chown -R phoenixd:phoenixd /data/phoenixd

# Enable and start phoenixd
sudo systemctl enable phoenixd
sudo systemctl start phoenixd

# Check status
sudo systemctl status phoenixd

# View logs
sudo journalctl -u phoenixd -f`}
        </CodeBlock>

        <WarningBox>
          On first start, phoenixd will generate a seed phrase. View it with:
          <code className="block mt-2">sudo -u phoenixd cat /data/phoenixd/seed.txt</code>
          Write this down and store it securely offline. This is the ONLY way to recover your funds!
        </WarningBox>

        <h3 className="text-xl font-semibold mt-6 mb-3">Get API Credentials</h3>
        <CodeBlock>
{`# phoenixd creates an HTTP basic auth password
# View the password with:
sudo -u phoenixd cat /data/phoenixd/phoenix.conf

# Look for the 'http-password' field
# You'll need this for phoenixd-dashboard setup`}
        </CodeBlock>
      </GuideSection>

      <GuideSection title="Install phoenixd-dashboard">
        <p>phoenixd-dashboard provides a modern web interface for managing your phoenixd node.</p>
        
        <CodeBlock>
{`# Create directory for dashboard
mkdir -p ~/phoenixd-dashboard
cd ~/phoenixd-dashboard

# Clone repository
git clone https://github.com/miguelmedeiros/phoenixd-dashboard.git .

# Copy environment file
cp .env.example .env.local

# Edit .env.local with your settings
nano .env.local`}
        </CodeBlock>

        <ConfigFile filename=".env.local">
{`# phoenixd Connection
PHOENIXD_URL=http://localhost:9740
PHOENIXD_PASSWORD=your_phoenixd_http_password_here

# Dashboard Security
NEXTAUTH_SECRET=generate_a_random_secret_here
NEXTAUTH_URL=http://localhost:3000

# Optional: Enable Tor support
# TOR_PROXY=socks5://127.0.0.1:9050`}
        </ConfigFile>

        <InfoBox>
          Generate NEXTAUTH_SECRET with: <code>openssl rand -base64 32</code>
        </InfoBox>

        <CodeBlock>
{`# Start with Docker Compose
docker compose up -d

# Check logs
docker compose logs -f

# Dashboard will be available at http://localhost:3000`}
        </CodeBlock>

        <h3 className="text-xl font-semibold mt-6 mb-3">First-Time Setup</h3>
        <p>Navigate to http://localhost:3000 in your browser:</p>
        <ul className="list-disc list-inside space-y-2 text-muted-foreground">
          <li>Follow the setup wizard</li>
          <li>Create a dashboard password</li>
          <li>Configure your profile and preferences</li>
          <li>The dashboard will auto-detect your phoenixd instance</li>
        </ul>
      </GuideSection>

      <GuideSection title="Install Nginx with SSL">
        <p>Set up Nginx as a reverse proxy for secure remote access.</p>
        
        <CodeBlock>
{`# Install Nginx and Certbot
sudo apt install -y nginx certbot python3-certbot-nginx

# Create Nginx configuration
sudo tee /etc/nginx/sites-available/phoenixd-dashboard << 'EOF'
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
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
EOF

# Enable site
sudo ln -s /etc/nginx/sites-available/phoenixd-dashboard /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx

# Obtain SSL certificate (replace with your domain)
sudo certbot --nginx -d your-domain.com

# Allow HTTPS through firewall
sudo ufw allow 'Nginx Full'`}
        </CodeBlock>

        <WarningBox>
          Replace <code>your-domain.com</code> with your actual domain name. 
          Ensure DNS records point to your server's IP address before running certbot.
        </WarningBox>

        <InfoBox>
          After SSL setup, update <code>NEXTAUTH_URL</code> in <code>.env.local</code> to use <code>https://your-domain.com</code>, 
          then restart the dashboard: <code>docker compose restart</code>
        </InfoBox>
      </GuideSection>

      <GuideSection title="Using phoenix-cli">
        <p>phoenixd includes a command-line interface for node management.</p>
        
        <h3 className="text-xl font-semibold mb-3">Common Commands</h3>
        <CodeBlock>
{`# Get node info
sudo -u phoenixd phoenix-cli --data-dir=/data/phoenixd getinfo

# Get balance
sudo -u phoenixd phoenix-cli --data-dir=/data/phoenixd balance

# Create invoice (amount in satoshis)
sudo -u phoenixd phoenix-cli --data-dir=/data/phoenixd createinvoice --amount-sat=10000 --description="Test invoice"

# Pay invoice
sudo -u phoenixd phoenix-cli --data-dir=/data/phoenixd payinvoice --invoice="lnbc..."

# List payments
sudo -u phoenixd phoenix-cli --data-dir=/data/phoenixd listpayments

# Get new on-chain address
sudo -u phoenixd phoenix-cli --data-dir=/data/phoenixd getnewaddress`}
        </CodeBlock>
      </GuideSection>

      <GuideSection title="Maintenance & Monitoring">
        <h3 className="text-xl font-semibold mb-3">Useful Commands</h3>
        <CodeBlock>
{`# Check service status
sudo systemctl status phoenixd

# View logs
sudo journalctl -u phoenixd -f
docker compose logs -f

# Check phoenixd dashboard
docker compose ps

# Restart services
sudo systemctl restart phoenixd
docker compose restart`}
        </CodeBlock>

        <h3 className="text-xl font-semibold mt-6 mb-3">Backup Strategy</h3>
        <WarningBox>
          Your phoenixd seed phrase is the ONLY way to recover your funds. Back it up securely!
        </WarningBox>
        
        <CodeBlock>
{`# Backup seed phrase (CRITICAL!)
sudo -u phoenixd cat /data/phoenixd/seed.txt > ~/phoenixd-seed-backup-$(date +%Y%m%d).txt

# Backup entire data directory
sudo tar -czf phoenixd-backup-$(date +%Y%m%d).tar.gz \\
  /data/phoenixd

# Store backups securely off-server
# Encrypt sensitive backups:
gpg -c ~/phoenixd-seed-backup-$(date +%Y%m%d).txt`}
        </CodeBlock>

        <h3 className="text-xl font-semibold mt-6 mb-3">Updates</h3>
        <CodeBlock>
{`# Update phoenixd
# 1. Stop phoenixd
sudo systemctl stop phoenixd

# 2. Download new version
cd /tmp
wget https://github.com/ACINQ/phoenixd/releases/download/vX.X.X/phoenix-X.X.X-linux-x64.zip
unzip phoenix-X.X.X-linux-x64.zip
cd phoenix-X.X.X-linux-x64

# 3. Install new binaries
sudo install -m 0755 -o root -g root phoenixd /usr/local/bin/phoenixd
sudo install -m 0755 -o root -g root phoenix-cli /usr/local/bin/phoenix-cli

# 4. Start phoenixd
sudo systemctl start phoenixd

# Update phoenixd-dashboard
cd ~/phoenixd-dashboard
git pull
docker compose pull
docker compose up -d`}
        </CodeBlock>
      </GuideSection>

      <GuideSection title="Troubleshooting">
        <h3 className="text-xl font-semibold mb-3">Common Issues</h3>
        
        <div className="space-y-4">
          <div className="border-l-4 border-primary pl-4">
            <h4 className="font-semibold mb-2">phoenixd won't start</h4>
            <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
              <li>Check logs: <code>sudo journalctl -u phoenixd -n 50</code></li>
              <li>Verify Java is installed: <code>java -version</code></li>
              <li>Check permissions: <code>ls -la /data/phoenixd</code></li>
              <li>Verify port 9740 is not in use: <code>sudo netstat -tuln | grep 9740</code></li>
            </ul>
          </div>

          <div className="border-l-4 border-primary pl-4">
            <h4 className="font-semibold mb-2">Can't access dashboard</h4>
            <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
              <li>Verify Docker containers are running: <code>docker compose ps</code></li>
              <li>Check dashboard logs: <code>docker compose logs</code></li>
              <li>Verify phoenixd is running: <code>sudo systemctl status phoenixd</code></li>
              <li>Check Nginx configuration: <code>sudo nginx -t</code></li>
            </ul>
          </div>

          <div className="border-l-4 border-primary pl-4">
            <h4 className="font-semibold mb-2">Payment failures</h4>
            <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
              <li>Check phoenixd logs: <code>sudo journalctl -u phoenixd -f</code></li>
              <li>Verify sufficient inbound liquidity</li>
              <li>Check if phoenixd is fully synced: <code>phoenix-cli getinfo</code></li>
              <li>Ensure internet connectivity and Tor is working</li>
            </ul>
          </div>

          <div className="border-l-4 border-primary pl-4">
            <h4 className="font-semibold mb-2">API authentication issues</h4>
            <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
              <li>Verify password in <code>/data/phoenixd/phoenix.conf</code></li>
              <li>Check <code>.env.local</code> has correct PHOENIXD_PASSWORD</li>
              <li>Restart dashboard after config changes: <code>docker compose restart</code></li>
            </ul>
          </div>
        </div>
      </GuideSection>

      <GuideSection title="Advantages of phoenixd">
        <ul className="space-y-2">
          <li className="flex items-start gap-2">
            <span className="text-primary mt-1">✓</span>
            <span><strong>Lower Resources:</strong> No need for a full Bitcoin node - significantly reduced storage and bandwidth requirements</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary mt-1">✓</span>
            <span><strong>Automatic Channel Management:</strong> phoenixd handles channel opening, closing, and rebalancing automatically</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary mt-1">✓</span>
            <span><strong>No Manual Liquidity:</strong> ACINQ provides automatic liquidity - no need to manually manage channels</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary mt-1">✓</span>
            <span><strong>Simpler Setup:</strong> Fewer components to install and configure compared to full LND stack</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary mt-1">✓</span>
            <span><strong>Built by Phoenix Team:</strong> Same technology as the trusted Phoenix mobile wallet</span>
          </li>
        </ul>
      </GuideSection>

      <GuideSection title="Next Steps">
        <ul className="space-y-2">
          <li className="flex items-start gap-2">
            <span className="text-primary mt-1">→</span>
            <span>Fund your phoenixd wallet via on-chain or Lightning</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary mt-1">→</span>
            <span>Set up automated backups with cron</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary mt-1">→</span>
            <span>Configure mobile access via Tailscale VPN or Cloudflare Tunnel</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary mt-1">→</span>
            <span>Install the phoenixd-dashboard PWA on your phone</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary mt-1">→</span>
            <span>Explore the built-in apps and create custom integrations</span>
          </li>
        </ul>
      </GuideSection>
    </GuideLayout>
  );
}
