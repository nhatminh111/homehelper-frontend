# Cleaning Company React Website

A modern React-based website for a professional cleaning company, converted from the original HTML/CSS/JavaScript template.

## Features

- **Modern React Architecture**: Built with React 18 and functional components
- **Responsive Design**: Mobile-first approach with Bootstrap 5
- **Client-side Routing**: Using React Router for seamless navigation
- **Interactive Forms**: Contact and appointment booking forms with state management
- **Font Awesome Icons**: Professional iconography throughout the site
- **Original Design Preserved**: Maintains the original cleaning company design and branding

## Pages

- **Home**: Hero section with appointment booking form
- **About**: Company information and statistics
- **Services**: Detailed service offerings with pricing plans
- **Portfolio**: Gallery of completed work
- **Pricing**: Service packages and pricing information
- **Blog**: Latest news and updates
- **Contact**: Contact form and company information

## Technologies Used

- React 18
- React Router DOM
- Bootstrap 5
- Font Awesome Icons
- CSS3 with custom animations
- Responsive design principles

## Getting Started

### Prerequisites

- Node.js (version 14 or higher)
- npm or yarn package manager

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd cleaning-company-react
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm start
```

4. Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

### Available Scripts

- `npm start` - Runs the app in development mode
- `npm test` - Launches the test runner
- `npm run build` - Builds the app for production
- `npm run eject` - Ejects from Create React App (one-way operation)

## Project Structure

```
src/
├── components/          # Reusable components
│   ├── Header.js       # Navigation and top bar
│   └── Footer.js       # Footer with company info
├── pages/              # Page components
│   ├── Home.js         # Home page with hero and booking
│   ├── About.js        # About page
│   ├── Services.js     # Services and pricing
│   ├── Portfolio.js    # Work gallery
│   ├── Pricing.js      # Pricing plans
│   ├── Blog.js         # Blog posts
│   └── Contact.js      # Contact form
├── App.js              # Main app component with routing
├── App.css             # Global styles
└── index.js            # App entry point

public/
├── images/             # All website images
├── css/                # Original CSS files
├── fonts/              # Font files
└── index.html          # HTML template
```

## Key Features

### Responsive Navigation
- Mobile-friendly hamburger menu
- Active page highlighting
- Smooth transitions

### Interactive Forms
- Appointment booking form on home page
- Contact form with validation
- State management with React hooks

### Modern UI/UX
- Clean, professional design
- Smooth animations and transitions
- Accessible navigation
- Fast loading times

## Customization

### Colors and Branding
Update the CSS variables in `src/App.css` to match your brand colors:

```css
:root {
  --primary-color: #007bff;
  --secondary-color: #6c757d;
  --accent-color: #28a745;
}
```

### Content
- Update company information in component files
- Replace images in `public/images/`
- Modify service offerings and pricing in respective components

### Styling
- Original CSS files are preserved in `public/css/`
- Custom styles can be added to `src/App.css`
- Bootstrap classes are available for layout and components

## Deployment

### Build for Production
```bash
npm run build
```

This creates a `build` folder with optimized production files.

### Deploy to Various Platforms

**Netlify:**
- Connect your repository to Netlify
- Set build command: `npm run build`
- Set publish directory: `build`

**Vercel:**
- Install Vercel CLI: `npm i -g vercel`
- Run: `vercel`

**GitHub Pages:**
- Add `"homepage": "https://username.github.io/repo-name"` to package.json
- Install gh-pages: `npm install --save-dev gh-pages`
- Add scripts: `"predeploy": "npm run build", "deploy": "gh-pages -d build"`
- Deploy: `npm run deploy`

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Internet Explorer 11+ (with polyfills)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support and questions, please contact the development team or create an issue in the repository.

---

**Note**: This React version maintains the original design and functionality while providing a modern, maintainable codebase with improved performance and user experience.
