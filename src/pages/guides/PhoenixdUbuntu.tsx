import { useSeoMeta } from '@unhead/react';
import { Link } from 'react-router-dom';
import { 
  GuideLayout, 
  GuideSection, 
  CodeBlock, 
  ConfigFile, 
  InfoBox, 
  WarningBox,
  RequirementsTable 
} from '@/components/GuideLayout';

export default function PhoenixdUbuntu() {
  useSeoMeta({
    title: 'phoenixd Setup Guide - Ubuntu LTS',
    description: 'Minimal guide for setting up phoenixd Lightning daemon on Ubuntu LTS with phoenixd-dashboard for VPS deployment.',
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
      description="Minimal guide for setting up phoenixd Lightning daemon on Ubuntu LTS with phoenixd-dashboard. Optimized for VPS deployment with reduced resource requirements."
      os="Ubuntu"
      daemon="phoenixd"
    >
      <GuideSection title="About phoenixd">
        <InfoBox>
          phoenixd is identical on Ubuntu and Debian. Most commands and configurations are the same. 
          The main difference is in the Docker installation process.
        </InfoBox>

        <h3 className="text-xl font-semibold mt-6 mb-3">System Requirements</h3>
        <RequirementsTable requirements={requirements} />
      </GuideSection>

      <GuideSection title="Prerequisites">
        <WarningBox>
          This guide assumes a fresh Ubuntu LTS (22.04 or 24.04) installation on a VPS.
        </WarningBox>

        <p>For swap configuration and SSH hardening, see the <Link to="/phoenixd/debian" className="text-primary underline">Debian guide</Link> - steps are identical for Ubuntu.</p>
      </GuideSection>

      <GuideSection title="Initial System Setup">
        <h3 className="text-xl font-semibold mb-3">Update System</h3>
        <CodeBlock>
{`# Update package lists and upgrade system
sudo apt update && sudo apt upgrade -y

# Install essential packages
sudo apt install -y curl wget git build-essential ufw fail2ban openjdk-21-jre`}
        </CodeBlock>

        <h3 className="text-xl font-semibold mt-6 mb-3">Configure Firewall</h3>
        <CodeBlock>
{`# Allow SSH
sudo ufw allow 22/tcp

# Enable firewall
sudo ufw enable
sudo ufw status`}
        </CodeBlock>
      </GuideSection>

      <GuideSection title="Install Docker">
        <p>Docker installation differs slightly on Ubuntu:</p>
        <CodeBlock>
{`# Remove old Docker versions
sudo apt remove docker docker-engine docker.io containerd runc

# Install dependencies
sudo apt install -y ca-certificates curl gnupg

# Add Docker's official GPG key
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg

# Set up Docker repository
echo \\
  "deb [arch="$(dpkg --print-architecture)" signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \\
  "$(. /etc/os-release && echo "$VERSION_CODENAME")" stable" | \\
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Install Docker Engine
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

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
        <p>Tor installation is identical to Debian:</p>
        <CodeBlock>
{`# Install Tor
sudo apt install -y tor

# Start and enable Tor
sudo systemctl enable tor
sudo systemctl start tor

# Configure Tor (edit /etc/tor/torrc)
sudo nano /etc/tor/torrc

# Add these lines:
# ControlPort 9051
# CookieAuthentication 1
# CookieAuthFileGroupReadable 1

# Restart Tor
sudo systemctl restart tor

# Add user to debian-tor group
sudo usermod -aG debian-tor $USER`}
        </CodeBlock>
      </GuideSection>

      <GuideSection title="Install phoenixd">
        <InfoBox>
          phoenixd installation is identical on Ubuntu and Debian. Follow the Debian guide for complete installation steps.
        </InfoBox>

        <h3 className="text-xl font-semibold mb-3">Quick Installation</h3>
        <CodeBlock>
{`# Create phoenixd user and directories
sudo adduser --disabled-password --gecos "" phoenixd
sudo mkdir -p /data/phoenixd
sudo chown phoenixd:phoenixd /data/phoenixd

# Download phoenixd (check github.com/ACINQ/phoenixd for latest version)
cd /tmp
wget https://github.com/ACINQ/phoenixd/releases/download/v0.7.2/phoenix-0.7.2-linux-x64.zip
unzip phoenix-0.7.2-linux-x64.zip
cd phoenix-0.7.2-linux-x64

# Install
sudo install -m 0755 -o root -g root phoenixd /usr/local/bin/phoenixd
sudo install -m 0755 -o root -g root phoenix-cli /usr/local/bin/phoenix-cli

# Verify
phoenixd --version`}
        </CodeBlock>

        <h3 className="text-xl font-semibold mt-6 mb-3">Configuration</h3>
        <ConfigFile filename="/data/phoenixd/phoenix.conf">
{`# Network
chain=mainnet

# HTTP API
http-bind-ip=0.0.0.0
http-bind-port=9740

# Auto liquidity
auto-liquidity=true

# Logging
log-level=INFO`}
        </ConfigFile>

        <h3 className="text-xl font-semibold mt-6 mb-3">Systemd Service</h3>
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

# Enable and start
sudo systemctl enable phoenixd
sudo systemctl start phoenixd

# Check status
sudo systemctl status phoenixd`}
        </CodeBlock>

        <WarningBox>
          After first start, backup your seed phrase:
          <code className="block mt-2">sudo -u phoenixd cat /data/phoenixd/seed.txt</code>
          Store it securely offline - this is the ONLY way to recover your funds!
        </WarningBox>
      </GuideSection>

      <GuideSection title="Install phoenixd-dashboard">
        <p>Dashboard installation is identical to Debian:</p>
        
        <CodeBlock>
{`# Clone repository
mkdir -p ~/phoenixd-dashboard
cd ~/phoenixd-dashboard
git clone https://github.com/miguelmedeiros/phoenixd-dashboard.git .

# Configure
cp .env.example .env.local
nano .env.local

# Set these values in .env.local:
# PHOENIXD_URL=http://localhost:9740
# PHOENIXD_PASSWORD=<from /data/phoenixd/phoenix.conf>
# NEXTAUTH_SECRET=<generate with: openssl rand -base64 32>
# NEXTAUTH_URL=http://localhost:3000

# Start with Docker Compose
docker compose up -d

# View logs
docker compose logs -f`}
        </CodeBlock>

        <InfoBox>
          Dashboard will be available at http://localhost:3000. Complete the setup wizard to get started.
        </InfoBox>
      </GuideSection>

      <GuideSection title="Install Nginx with SSL">
        <p>Nginx setup is identical to Debian. See the Debian guide for complete SSL configuration with Certbot.</p>
        
        <CodeBlock>
{`# Install Nginx and Certbot
sudo apt install -y nginx certbot python3-certbot-nginx

# Create configuration
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
    }
}
EOF

# Enable and get SSL
sudo ln -s /etc/nginx/sites-available/phoenixd-dashboard /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
sudo certbot --nginx -d your-domain.com
sudo ufw allow 'Nginx Full'`}
        </CodeBlock>
      </GuideSection>

      <GuideSection title="Using phoenix-cli">
        <h3 className="text-xl font-semibold mb-3">Common Commands</h3>
        <CodeBlock>
{`# Get node info
sudo -u phoenixd phoenix-cli --data-dir=/data/phoenixd getinfo

# Check balance
sudo -u phoenixd phoenix-cli --data-dir=/data/phoenixd balance

# Create invoice (10,000 sats)
sudo -u phoenixd phoenix-cli --data-dir=/data/phoenixd createinvoice --amount-sat=10000 --description="Test"

# Pay invoice
sudo -u phoenixd phoenix-cli --data-dir=/data/phoenixd payinvoice --invoice="lnbc..."

# List payments
sudo -u phoenixd phoenix-cli --data-dir=/data/phoenixd listpayments`}
        </CodeBlock>
      </GuideSection>

      <GuideSection title="Maintenance">
        <h3 className="text-xl font-semibold mb-3">Service Management</h3>
        <CodeBlock>
{`# Check status
sudo systemctl status phoenixd
docker compose ps

# View logs
sudo journalctl -u phoenixd -f
docker compose logs -f

# Restart services
sudo systemctl restart phoenixd
docker compose restart`}
        </CodeBlock>

        <h3 className="text-xl font-semibold mt-6 mb-3">Backups</h3>
        <WarningBox>
          Always backup your seed phrase and data directory!
        </WarningBox>
        
        <CodeBlock>
{`# Backup seed (CRITICAL!)
sudo -u phoenixd cat /data/phoenixd/seed.txt > ~/seed-backup-$(date +%Y%m%d).txt

# Backup data directory
sudo tar -czf phoenixd-backup-$(date +%Y%m%d).tar.gz /data/phoenixd

# Store backups securely off-server`}
        </CodeBlock>

        <h3 className="text-xl font-semibold mt-6 mb-3">Updates</h3>
        <CodeBlock>
{`# Update phoenixd
sudo systemctl stop phoenixd
# Download new version and install as shown above
sudo systemctl start phoenixd

# Update dashboard
cd ~/phoenixd-dashboard
git pull
docker compose pull
docker compose up -d`}
        </CodeBlock>
      </GuideSection>

      <GuideSection title="Troubleshooting">
        <p>Most troubleshooting steps are identical between Ubuntu and Debian. See the <Link to="/phoenixd/debian" className="text-primary underline">Debian guide</Link> for detailed troubleshooting.</p>
        
        <h3 className="text-xl font-semibold mt-6 mb-3">Quick Checks</h3>
        <CodeBlock>
{`# Check phoenixd logs
sudo journalctl -u phoenixd -n 50

# Check dashboard logs
docker compose logs

# Verify services are running
sudo systemctl status phoenixd
docker compose ps

# Test phoenixd API
curl -u :$(sudo -u phoenixd cat /data/phoenixd/phoenix.conf | grep http-password | cut -d'=' -f2) \\
  http://localhost:9740/getinfo`}
        </CodeBlock>
      </GuideSection>

      <GuideSection title="Next Steps">
        <ul className="space-y-2">
          <li className="flex items-start gap-2">
            <span className="text-primary mt-1">→</span>
            <span>Fund your phoenixd wallet and start making payments</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary mt-1">→</span>
            <span>Set up automated backups</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary mt-1">→</span>
            <span>Configure remote access via VPN or Cloudflare Tunnel</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary mt-1">→</span>
            <span>Install phoenixd-dashboard as a PWA on mobile devices</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary mt-1">→</span>
            <span>Explore the dashboard's built-in apps and integrations</span>
          </li>
        </ul>
      </GuideSection>
    </GuideLayout>
  );
}
