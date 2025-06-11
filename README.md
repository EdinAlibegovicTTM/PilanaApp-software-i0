# Pilana APP - Advanced Form Builder

A comprehensive form building application with AI-powered features, Google Sheets integration, and advanced field types.

## 🚀 Features

### Core Functionality
- **Advanced Form Builder**: Drag & drop interface with desktop and mobile layouts
- **Multi-Role Authentication**: Admin, Manager, and User roles with different permissions
- **Google Sheets Integration**: Direct data export and import capabilities
- **QR Code Scanner**: Product lookup and dynamic form population
- **AI Copilot**: Intelligent form generation and optimization (Admin only)

### Field Types
- Text, Number, Date, Dropdown
- Product Lookup with Google Sheets integration
- QR Scanner with configurable actions
- QR Product Scanner with dynamic field generation
- Geolocation, DateTime, User auto-fill
- Formula fields with calculations

### Advanced Features
- **Responsive Design**: Optimized for desktop, tablet, and mobile
- **Progressive Web App**: Installable with offline capabilities
- **Real-time Preview**: See forms as users will experience them
- **Auto-save**: Automatic draft saving and recovery
- **Form Analytics**: AI-powered performance insights

## 🛠 Technology Stack

- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: Tailwind CSS, shadcn/ui components
- **Drag & Drop**: react-dnd with touch support
- **Icons**: Lucide React
- **Storage**: Local Storage (production ready for database integration)

## 📦 Installation

1. Clone the repository
2. Install dependencies:
   \`\`\`bash
   npm install
   \`\`\`
3. Run the development server:
   \`\`\`bash
   npm run dev
   \`\`\`
4. Open [http://localhost:3000](http://localhost:3000)

## 🔐 Default Login Credentials

- **Admin**: username: `admin`, password: `admin123`
- **Manager**: username: `manager`, password: `manager123`
- **User**: username: `user`, password: `user123`

## 🚀 Deployment

### Vercel (Recommended)
1. Connect your repository to Vercel
2. Deploy automatically with zero configuration

### Docker
\`\`\`bash
docker build -t pilana-app .
docker run -p 3000:3000 pilana-app
\`\`\`

### Manual Deployment
\`\`\`bash
npm run build
npm start
\`\`\`

## 🔧 Configuration

### Google Sheets Integration
1. Create a Google Sheets API key
2. Configure sheet URLs in form settings
3. Set up column mappings for data export

### AI Features
- AI Copilot requires admin privileges
- Customize AI responses in `/app/api/ai/` endpoints
- Extend with real AI services as needed

## 📱 Progressive Web App

The application includes PWA features:
- Installable on mobile devices
- Offline form creation and editing
- Auto-sync when connection is restored

## 🎯 Usage

### For Administrators
- Create and manage forms with the advanced builder
- Use AI Copilot for form generation and optimization
- Analyze form performance with AI insights
- Manage users and permissions

### For Managers
- Create and edit forms
- Publish forms for user access
- View form submissions and analytics

### For Users
- Fill out published forms
- Use QR scanner for quick data entry
- Access forms on any device

## 🔄 Data Flow

1. **Form Creation**: Drag & drop builder with real-time preview
2. **Form Publishing**: Make forms available to users
3. **Data Collection**: Users fill forms with various input methods
4. **Data Export**: Automatic export to Google Sheets
5. **Analytics**: AI-powered insights and recommendations

## 🛡 Security

- Role-based access control
- Input validation and sanitization
- Secure API endpoints
- Admin-only AI features

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- Check the documentation
- Review the code comments
- Contact the development team

---

Built with ❤️ for efficient form management and data collection.
