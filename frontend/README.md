# Rate Limiter Service - Frontend Showcase

This directory contains the static website for showcasing the Rate Limiter Service.

## 🚀 Overview

The website is built with vanilla HTML, CSS, and JavaScript to ensure it's lightweight and easy to deploy anywhere. It features:

- **Modern Landing Page**: Clean design with white & green color scheme
- **Interactive Elements**: Tabbed code examples, copy-to-clipboard, smooth scrolling
- **Comprehensive Documentation**: Complete guides for integration and configuration
- **Responsive Design**: Fully optimized for mobile and desktop

## 🛠️ Setup

To view the website locally, you can use any static file server.

### Using Python

```bash
cd frontend
python3 -m http.server 8000
```

Then visit `http://localhost:8000`

### Using Node.js (http-server)

```bash
npx http-server frontend
```

## 📁 Structure

```
frontend/
├── index.html          # Main landing page
├── styles.css          # Global styles (CSS variables, responsive layout)
├── script.js           # Interactive functionality
├── assets/             # Images and icons
│   └── icons/
└── docs/               # Documentation pages
    ├── getting-started.html
    ├── integration.html
    ├── api-reference.html
    └── configuration.html
```

## 🎨 Customization

- **Colors**: Edit CSS variables in `styles.css` root
- **Content**: Update HTML files directly
- **Icons**: SVG icons are embedded directly in HTML for performance

## 📦 Deployment

Since this is a static site, it can be deployed to:

- GitHub Pages
- Vercel
- Netlify
- AWS S3 / CloudFront
- Nginx / Apache
