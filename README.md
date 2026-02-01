# Lightning Node Setup Guides

Comprehensive documentation website for setting up Bitcoin and Lightning Network nodes on Debian and Ubuntu LTS. Optimized for minimal VPS overhead with pruned Bitcoin backends.

## 🌐 Live Site

Visit [ln.fizx.uk](https://ln.fizx.uk) (when deployed)

## 📚 Available Guides

### LND (Lightning Network Daemon)
- **[LND + Debian LTS](/lnd/debian)** - Complete LND setup with ThunderHub, LNDG, and Balance of Satoshis
- **[LND + Ubuntu LTS](/lnd/ubuntu)** - Same stack for Ubuntu environments

### phoenixd (ACINQ Lightning)
- **[phoenixd + Debian LTS](/phoenixd/debian)** - Minimal phoenixd setup with phoenixd-dashboard
- **[phoenixd + Ubuntu LTS](/phoenixd/ubuntu)** - phoenixd for Ubuntu systems

## 🔧 Tech Stack

- **React 18** with TypeScript
- **TailwindCSS** for styling
- **shadcn/ui** components
- **Vite** build tool
- **React Router** for navigation
- **Nostr** integration (via MKStack template)

## 🚀 Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Run tests
npm run test
```

## 📦 What's Included

Each guide covers:

### Core Services
- ✓ Bitcoin Core (bitcoind) with pruned backend (LND guides)
- ✓ Lightning daemon (LND or phoenixd)
- ✓ Web dashboards (ThunderHub, LNDG, phoenixd-dashboard)
- ✓ CLI tools (Balance of Satoshis for LND)

### Infrastructure
- ✓ Tor for hidden service access
- ✓ Nginx with SSL/TLS for remote access
- ✓ Docker & Docker Compose
- ✓ ZSH shell configuration
- ✓ Hardware key SSH authentication
- ✓ Firewall configuration (ufw)

### VPS Optimizations
- ✓ Pruned Bitcoin backend (5GB) for minimal storage
- ✓ Memory optimization with swap configuration
- ✓ Bandwidth limits and connection management
- ✓ System requirement recommendations

## 🎯 Target Audience

These guides are designed for:
- Users deploying Lightning nodes on VPS instances
- Those seeking minimal-overhead setups
- Operators wanting production-ready configurations
- Anyone following best practices for node security

## 📖 Guide Structure

Each guide includes:
1. **Prerequisites** - System requirements and preparation
2. **Initial Setup** - OS configuration and security hardening
3. **Service Installation** - Step-by-step installation of all components
4. **Configuration** - Production-ready config files
5. **Maintenance** - Backup strategies and update procedures
6. **Troubleshooting** - Common issues and solutions

## 🔐 Security Features

- Hardware key-based SSH authentication (YubiKey support)
- Tor hidden services for privacy
- SSL/TLS encryption via Nginx and Certbot
- Firewall configuration with fail2ban
- Regular backup procedures

## 💾 Configuration Files

Reference configurations included for:
- `bitcoin.conf` - Optimized for pruned VPS deployment
- `lnd.conf` - Production LND configuration with Tor
- `phoenix.conf` - phoenixd configuration
- Systemd service files
- Nginx reverse proxy configs
- Docker Compose setups

## 🌐 Deployment

This site is built with static HTML/CSS/JS and can be deployed to:
- GitHub Pages
- Netlify
- Vercel
- Any static hosting service

### GitHub Pages Deployment

1. Build the project: `npm run build`
2. Deploy the `dist` folder to your `gh-pages` branch
3. Configure custom domain (ln.fizx.uk) in repository settings

## 📄 License

This documentation is open source and available for use under the MIT License.

## 🤝 Contributing

Contributions welcome! This guide is built with [Shakespeare](https://shakespeare.diy).

## ⚠️ Disclaimer

These guides are provided as-is for educational purposes. Always:
- Test with small amounts first
- Backup your seed phrases securely
- Understand the risks of running Lightning nodes
- Keep software updated
- Follow security best practices

**Mainnet = Real Bitcoin!** ⚡

## 📞 Support

For issues or questions:
- Open an issue on GitHub
- Join Lightning Network community forums
- Consult the official documentation:
  - [Bitcoin Core](https://bitcoincore.org)
  - [LND](https://github.com/lightningnetwork/lnd)
  - [phoenixd](https://github.com/ACINQ/phoenixd)

## 🎨 Built With

This site was created with [Shakespeare](https://shakespeare.diy) - an AI-powered web development platform.
