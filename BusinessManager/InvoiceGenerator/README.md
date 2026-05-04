# Invoice Generator with Email Support

A professional invoice generation and management system built with HTML, CSS, and JavaScript, with email sending capabilities.

## Features

✅ **Professional Invoice Templates**
- Customizable company details
- Customer/Bill-to information
- Itemized line items with automatic calculations
- Tax (GST) support
- Bank details section
- Professional styling and layout

✅ **Invoice Management**
- Create, edit, and manage invoices
- Add/remove line items
- Automatic calculation of totals
- Amount conversion to words

✅ **Export & Share**
- 📧 **Send via Email** - Send invoices directly to customers
- 📥 Download as PDF
- 🖨️ Print functionality
- HTML preview

✅ **Easy to Use**
- Intuitive web-based interface
- No installation required (basic version)
- Real-time preview updates

## Quick Start

### Without Email (Static Version)
Simply open `index.html` in your browser.

### With Email Support

#### Prerequisites
- Node.js (v14 or higher)
- npm (comes with Node.js)

#### Installation

1. **Navigate to the InvoiceGenerator folder:**
   ```bash
   cd InvoiceGenerator
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Email (Important!):**
   - Copy `.env.example` to `.env`
   - Edit `.env` and add your email credentials

#### Email Configuration

**For Gmail Users:**
1. Go to [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)
2. Create an App Password
3. Add to your `.env` file:
   ```
   EMAIL_SERVICE=gmail
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASSWORD=your-app-password
   EMAIL_FROM=your-email@gmail.com
   ```

**For Other Email Providers:**
Edit `.env` and set:
```
EMAIL_SERVICE=outlook  # or 'yahoo', 'mail', etc.
EMAIL_USER=your-email@provider.com
EMAIL_PASSWORD=your-password
```

**For Custom SMTP:**
```
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-username
SMTP_PASSWORD=your-password
```

#### Start the Server

```bash
npm start
```

The application will run at: **http://localhost:3000**

## Usage

### Create an Invoice

1. **Edit Details**
   - Click "📝 Edit Invoice Details"
   - Fill in company information
   - Fill in customer details
   - Update invoice number, date, and service period

2. **Add Line Items**
   - Click "📋 Add/Edit Line Items"
   - Add services/products with quantities and rates
   - Items are calculated automatically

3. **View Preview**
   - See the invoice preview update in real-time
   - All calculations are done automatically

### Send Invoice

1. Click "📧 Send Email" button
2. Enter recipient email address
3. (Optional) Enter recipient name
4. Click "Send Invoice"
5. Invoice will be sent as HTML email with all formatting

### Download/Print

- **Download PDF:** Click "📥 Download PDF" button
- **Print:** Click "🖨️ Print" button or use browser print

## File Structure

```
InvoiceGenerator/
├── index.html          # Main HTML file
├── script.js           # JavaScript functionality
├── styles.css          # Styling
├── server.js           # Node.js backend (for email)
├── package.json        # Dependencies
├── .env.example        # Email configuration template
└── .env                # Email configuration (you create this)
```

## Customization

### Change Company Details
Edit the form in the web interface or update default values in `script.js`

### Change Invoice Template
Customize the invoice styling by editing the `styles.css` file

### Modify Email Template
Edit the email HTML format in the `sendInvoiceEmail()` function in `script.js`

## Troubleshooting

### Email not sending?

1. **Check if email is configured:**
   - Make sure `.env` file exists in the InvoiceGenerator folder
   - Check that EMAIL_USER and EMAIL_PASSWORD are set

2. **Gmail Users:**
   - Make sure you're using App Password, not regular password
   - Enable 2-factor authentication if not already enabled
   - Visit [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)

3. **Test Configuration:**
   - Check the email status by looking at browser console
   - Check server logs in terminal

4. **Server Not Starting?**
   - Make sure port 3000 is not in use
   - Try: `npm start -- --port 3001`

## API Endpoints (Backend)

- `GET /` - Serve the web application
- `POST /api/send-invoice` - Send invoice via email
- `GET /api/health` - Check server status
- `GET /api/email-status` - Check email configuration

## Browser Compatibility

- Chrome (recommended)
- Firefox
- Safari
- Edge

## Security Notes

- Never commit `.env` file with credentials to version control
- Use App Passwords for Gmail, not your main password
- Consider using environment variables in production
- Store sensitive data securely

## License

MIT License - Feel free to use and modify

## Support

For issues or questions, please contact: info@mcharvtechlabs.com

---

**Made with ❤️ by MCHARV TECHLABS**
