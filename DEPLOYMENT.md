# Deployment Guide for Mood.ai

This guide will help you deploy Mood.ai to your own domain using SQLite database.

## Prerequisites

- A server with Node.js 18+ installed
- A domain name pointing to your server
- SSH access to your server

## Database Setup

✅ **SQLite is already configured!** The database file will be created at `./data/moodai.db`

No additional database server setup is required. SQLite is a file-based database that's perfect for small to medium applications.

## Deployment Steps

### 1. Prepare Your Server

SSH into your server:
```bash
ssh user@your-domain.com
```

Install Node.js if not already installed:
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### 2. Clone Your Repository

```bash
git clone https://github.com/Rohit-girish-Belagali/kanyarasi.git
cd kanyarasi
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Set Up Environment Variables

Create a `.env` file:
```bash
nano .env
```

Add your API keys:
```env
GEMINI_API_KEY=your_gemini_api_key_here
ELEVENLABS_API_KEY=your_elevenlabs_api_key_here
```

Save and exit (Ctrl+X, then Y, then Enter)

### 5. Initialize Database

Run the database migration:
```bash
npm run db:push
```

This will create the SQLite database file at `./data/moodai.db`

### 6. Build the Application

```bash
npm run build
```

### 7. Start the Application

For production, use PM2 (process manager):

Install PM2:
```bash
sudo npm install -g pm2
```

Start the app:
```bash
pm2 start npm --name "moodai" -- start
```

Save PM2 configuration:
```bash
pm2 save
pm2 startup
```

### 8. Set Up Nginx (Reverse Proxy)

Install Nginx:
```bash
sudo apt-get install nginx
```

Create Nginx configuration:
```bash
sudo nano /etc/nginx/sites-available/moodai
```

Add this configuration (replace `your-domain.com`):
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:5001;
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
```

Enable the site:
```bash
sudo ln -s /etc/nginx/sites-available/moodai /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 9. Set Up SSL (HTTPS)

Install Certbot:
```bash
sudo apt-get install certbot python3-certbot-nginx
```

Get SSL certificate:
```bash
sudo certbot --nginx -d your-domain.com
```

Follow the prompts to complete SSL setup.

### 10. Verify Deployment

Visit your domain: `https://your-domain.com`

You should see the Mood.ai login screen!

## Managing Your Application

### View Logs
```bash
pm2 logs moodai
```

### Restart Application
```bash
pm2 restart moodai
```

### Stop Application
```bash
pm2 stop moodai
```

### Update Application
```bash
git pull
npm install
npm run build
pm2 restart moodai
```

## Database Backup

Since SQLite is file-based, backing up is simple:

### Create Backup
```bash
cp data/moodai.db data/moodai.db.backup-$(date +%Y%m%d)
```

### Automated Daily Backups
Add to crontab:
```bash
crontab -e
```

Add this line:
```
0 2 * * * cp /path/to/kanyarasi/data/moodai.db /path/to/backups/moodai.db.backup-$(date +\%Y\%m\%d)
```

## Troubleshooting

### Port Already in Use
```bash
pm2 stop moodai
lsof -ti:5001 | xargs kill -9
pm2 start moodai
```

### Database Locked
SQLite can lock if multiple processes try to write. Ensure only one instance is running:
```bash
pm2 list
```

### Check Application Status
```bash
pm2 status
pm2 logs moodai --lines 100
```

## Security Recommendations

1. **Firewall**: Only allow ports 80, 443, and 22
   ```bash
   sudo ufw allow 22
   sudo ufw allow 80
   sudo ufw allow 443
   sudo ufw enable
   ```

2. **Keep Updated**: Regularly update your system
   ```bash
   sudo apt-get update && sudo apt-get upgrade
   ```

3. **Backup Regularly**: Set up automated backups of your database

4. **Monitor Logs**: Check PM2 logs regularly for errors

## Performance Tips

1. **Enable Gzip** in Nginx for faster loading
2. **Set up CDN** for static assets (optional)
3. **Monitor disk space** - SQLite database will grow over time
4. **Regular cleanup** - Delete old messages if needed

## Support

For issues or questions:
- Check the logs: `pm2 logs moodai`
- Review the README.md file
- Check GitHub issues

---

**Congratulations!** Your Mood.ai application is now deployed and running on your domain with SQLite database! 🎉
