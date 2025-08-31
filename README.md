# 🔌 Dobi Protocol Frontend

Frontend interface for Dobi Protocol Web3 IoT platform with integrated API proxy to avoid CORS issues.

## 🚀 Features

- **Modern Dark Theme** - Elegant dark interface matching dobi.guru aesthetic
- **Real-time API Integration** - Direct connection to Dobi API with proxy
- **Charger Management** - View and manage IoT chargers from the API
- **Web3 Integration** - MetaMask wallet connection
- **Responsive Design** - Works on all devices
- **Real-time Statistics** - Live dashboard with charger data

## 🛠️ Installation

### Prerequisites
- Node.js 16+ 
- npm or yarn

### Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/Matias-QR/dobi.git
   cd dobi
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the server**
   ```bash
   npm start
   ```

4. **Open your browser**
   Navigate to `http://localhost:3001`

## 📁 Project Structure

```
dobi/
├── public/                 # Frontend files
│   ├── index.html         # Main HTML file
│   ├── styles/            # CSS files
│   ├── js/                # JavaScript modules
│   └── services/          # API services
├── server.js              # Express server with proxy
├── package.json           # Dependencies
└── README.md             # This file
```

## 🔌 API Integration

The frontend connects to the Dobi API at `https://api-aleph.dobi.guru` through a local proxy to avoid CORS issues.

### Available Endpoints
- **Chargers**: `/api/chargers/detailed` - Get detailed charger information
- **Devices**: `/api/devices/*` - Device management
- **Transactions**: `/api/transactions/*` - Transaction history

## 🎨 Customization

### Colors
The theme uses CSS variables that can be easily modified in `public/styles/main.css`:

```css
:root {
    --primary-color: #00d4aa;
    --bg-color: #0f0f23;
    --text-color: #ffffff;
    /* ... more variables */
}
```

### Components
All UI components are styled in separate CSS files:
- `main.css` - Global styles and layout
- `components.css` - Buttons, cards, modals
- `forms.css` - Form styling
- `responsive.css` - Mobile responsiveness

## 🚀 Development

### Development Mode
```bash
npm run dev
```
Uses nodemon for automatic server restart on file changes.

### Static File Serving
```bash
npm run serve
```
Uses http-server for static file serving (without proxy).

## 🔧 Troubleshooting

### CORS Issues
If you encounter CORS errors, make sure you're using the Express server (`npm start`) instead of the static server.

### API Connection
Check the server console for proxy logs. The server automatically proxies all `/api/*` requests to the Dobi API.

### Port Conflicts
If port 3001 is busy, change the PORT environment variable:
```bash
PORT=3002 npm start
```

## 📱 Browser Support

- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details.

## 🔗 Links

- **Dobi Protocol**: https://dobi.guru
- **API Documentation**: https://api-aleph.dobi.guru
- **Repository**: https://github.com/Matias-QR/dobi

## 📞 Support

For support or questions:
- Create an issue in this repository
- Contact the Dobi Protocol team
- Check the API documentation

---

**Made with ❤️ by the Dobi Protocol Team**
