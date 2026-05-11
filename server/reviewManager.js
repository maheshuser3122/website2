import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const __dirname = dirname(fileURLToPath(import.meta.url));
const dataDir = join(__dirname, '../data');
const reviewsFile = join(dataDir, 'reviews.json');
const invitesFile = join(dataDir, 'review-invites.json');

// Email configuration (same as invoice system)
let transporter;

function initializeEmailTransport() {
  if (process.env.SMTP_HOST) {
    // Custom SMTP server
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true',
      connectionTimeout: 10000,
      socketTimeout: 10000,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD
      }
    });
  } else {
    // Gmail or generic email service
    transporter = nodemailer.createTransport({
      service: process.env.EMAIL_SERVICE || 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      },
      connectionTimeout: 10000,
      socketTimeout: 10000
    });
  }
}

initializeEmailTransport();

// Ensure data directory exists
if (!existsSync(dataDir)) {
  mkdirSync(dataDir, { recursive: true });
}

// Initialize files if they don't exist
const initFiles = () => {
  if (!existsSync(reviewsFile)) {
    writeFileSync(reviewsFile, JSON.stringify({ reviews: [] }, null, 2));
  }
  if (!existsSync(invitesFile)) {
    writeFileSync(invitesFile, JSON.stringify({ invites: [] }, null, 2));
  }
};

initFiles();

// Generate secure random token
const generateToken = () => crypto.randomBytes(32).toString('hex');

// GET all reviews (public API)
export const getPublicReviews = (req, res) => {
  try {
    const data = JSON.parse(readFileSync(reviewsFile, 'utf8'));
    const approved = data.reviews.filter(r => r.status === 'approved');
    res.json(approved);
  } catch (error) {
    console.error('[Reviews] Error reading reviews:', error.message);
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
};

// POST new review (from temp user via invite link)
export const submitReview = (req, res) => {
  try {
    const { token, name, designation, location, rating, reviewText } = req.body;

    // Validate token
    const invitesData = JSON.parse(readFileSync(invitesFile, 'utf8'));
    const invite = invitesData.invites.find(i => i.token === token && !i.revoked);

    if (!invite) {
      return res.status(401).json({ error: 'Invalid or expired invite link' });
    }

    // Mark invite as used
    invite.usedAt = new Date().toISOString();
    writeFileSync(invitesFile, JSON.stringify(invitesData, null, 2));

    // Add review as pending
    const reviewsData = JSON.parse(readFileSync(reviewsFile, 'utf8'));
    const newReview = {
      id: Date.now().toString(),
      name,
      designation,
      location,
      rating: parseInt(rating),
      reviewText,
      status: 'pending',
      createdAt: new Date().toISOString(),
      approvedAt: null
    };

    reviewsData.reviews.push(newReview);
    writeFileSync(reviewsFile, JSON.stringify(reviewsData, null, 2));

    res.json({ success: true, message: 'Review submitted for approval', id: newReview.id });
  } catch (error) {
    console.error('[Reviews] Error submitting review:', error.message);
    res.status(500).json({ error: 'Failed to submit review' });
  }
};

// GET all reviews + invites (admin API)
export const getAdminReviews = (req, res) => {
  try {
    const reviewsData = JSON.parse(readFileSync(reviewsFile, 'utf8'));
    const invitesData = JSON.parse(readFileSync(invitesFile, 'utf8'));
    
    res.json({
      reviews: reviewsData.reviews,
      invites: invitesData.invites
    });
  } catch (error) {
    console.error('[Reviews] Error reading admin reviews:', error.message);
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
};

// POST create invite link (admin)
export const createInvite = async (req, res) => {
  try {
    const { email } = req.body;
    console.log('[Reviews] Create invite request for:', email);
    
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const invitesData = JSON.parse(readFileSync(invitesFile, 'utf8'));
    
    const token = generateToken();
    const domain = process.env.DOMAIN || 'http://localhost:3000';
    const shareLink = `${domain}/review/${token}`;
    
    const newInvite = {
      id: Date.now().toString(),
      email,
      token,
      createdAt: new Date().toISOString(),
      usedAt: null,
      revoked: false,
      link: `/review/${token}`
    };

    invitesData.invites.push(newInvite);
    writeFileSync(invitesFile, JSON.stringify(invitesData, null, 2));

    // Send email with invite link
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Barlow, sans-serif; background: #f5f5f5; margin: 0; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); overflow: hidden; }
    .header { background: linear-gradient(135deg, #D4A032, #F0BE56); color: #060D1A; padding: 30px; text-align: center; }
    .header h1 { margin: 0; font-size: 1.8rem; font-weight: 900; letter-spacing: 1px; }
    .body { padding: 30px; color: #C8D8E8; }
    .body p { line-height: 1.6; margin-bottom: 15px; }
    .button-container { text-align: center; margin: 30px 0; }
    .button { display: inline-block; background: linear-gradient(135deg, #D4A032, #F0BE56); color: #060D1A; padding: 14px 28px; border-radius: 4px; text-decoration: none; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; }
    .button:hover { opacity: 0.9; }
    .link-text { background: #f5f5f5; padding: 12px; border-radius: 4px; word-break: break-all; font-size: 0.85rem; font-family: monospace; color: #666; margin: 20px 0; }
    .footer { background: #f5f5f5; padding: 20px; text-align: center; font-size: 0.85rem; color: #999; border-top: 1px solid #ddd; }
    .badge { background: #142848; color: #D4A032; display: inline-block; padding: 8px 12px; border-radius: 3px; font-size: 0.75rem; font-weight: 700; margin: 10px 0; letter-spacing: 0.5px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Mc'Harv Techlabs</h1>
      <p style="margin: 10px 0 0; font-size: 0.9rem; opacity: 0.9;">Share Your Experience</p>
    </div>
    <div class="body" style="background: #0C1E35;">
      <p>Hi there,</p>
      <p>We'd love to hear about your experience working with Mc'Harv Techlabs! Your feedback is invaluable to us.</p>
      
      <div class="button-container">
        <a href="${shareLink}" class="button">Submit Your Review</a>
      </div>

      <p><strong>Or copy this link:</strong></p>
      <div class="link-text">${shareLink}</div>

      <div style="background: rgba(212, 160, 50, 0.1); padding: 15px; border-radius: 4px; margin: 20px 0;">
        <p style="margin: 0 0 10px; color: #D4A032; font-weight: 700;">📋 What we'd like to know:</p>
        <ul style="margin: 0; padding-left: 20px; color: #C8D8E8;">
          <li>Your name and designation</li>
          <li>Your location</li>
          <li>A rating (1-5 stars)</li>
          <li>Your detailed review</li>
        </ul>
      </div>

      <p style="font-size: 0.9rem; color: #7A95B0;">⏱️ This link is personal to you and can be revoked by our team. It's valid until we deactivate it.</p>
      <p style="font-size: 0.9rem; color: #7A95B0;">Thank you for taking the time to share your feedback! It helps us serve you better.</p>
      
      <p>Best regards,<br><strong>Mc'Harv Techlabs Team</strong></p>
    </div>
    <div class="footer">
      <p>© 2026 Mc'Harv Techlabs. All rights reserved.</p>
      <p><a href="https://mcharvtechlabs.com" style="color: #D4A032; text-decoration: none;">mcharvtechlabs.com</a> | +44 7771 090667</p>
    </div>
  </div>
</body>
</html>
    `;

    try {
      console.log('[Reviews] Attempting to send email to:', email);
      console.log('[Reviews] Email config - user:', process.env.EMAIL_USER);
      
      const mailResult = await transporter.sendMail({
        from: `Mc'Harv Techlabs <${process.env.EMAIL_USER || process.env.SMTP_USER}>`,
        to: email,
        subject: "We'd Love Your Feedback — Review Invitation from Mc'Harv Techlabs",
        html: htmlContent
      });

      console.log(`[Reviews] ✓ Email sent successfully to ${email}. Message ID:`, mailResult.messageId);
      
      res.json({
        success: true,
        invite: newInvite,
        shareLink: shareLink,
        emailSent: true,
        message: `✓ Invite link sent to ${email}`
      });
    } catch (emailError) {
      console.error('[Reviews] Email send failed:', emailError.message);
      // Still return success but note that email failed
      res.json({
        success: true,
        invite: newInvite,
        shareLink: shareLink,
        emailSent: false,
        message: `Invite created but email failed. Share link manually: ${shareLink}`,
        warning: 'Email could not be sent. Please share the link manually with the reviewer.'
      });
    }
  } catch (error) {
    console.error('[Reviews] Error creating invite:', error.message);
    res.status(500).json({ error: 'Failed to create invite' });
  }
};

// POST approve review (admin)
export const approveReview = (req, res) => {
  try {
    const { reviewId } = req.body;
    
    const reviewsData = JSON.parse(readFileSync(reviewsFile, 'utf8'));
    const review = reviewsData.reviews.find(r => r.id === reviewId);

    if (!review) {
      return res.status(404).json({ error: 'Review not found' });
    }

    review.status = 'approved';
    review.approvedAt = new Date().toISOString();
    writeFileSync(reviewsFile, JSON.stringify(reviewsData, null, 2));

    res.json({ success: true, message: 'Review approved' });
  } catch (error) {
    console.error('[Reviews] Error approving review:', error.message);
    res.status(500).json({ error: 'Failed to approve review' });
  }
};

// POST reject review (admin)
export const rejectReview = (req, res) => {
  try {
    const { reviewId } = req.body;
    
    const reviewsData = JSON.parse(readFileSync(reviewsFile, 'utf8'));
    const review = reviewsData.reviews.find(r => r.id === reviewId);

    if (!review) {
      return res.status(404).json({ error: 'Review not found' });
    }

    review.status = 'rejected';
    writeFileSync(reviewsFile, JSON.stringify(reviewsData, null, 2));

    res.json({ success: true, message: 'Review rejected' });
  } catch (error) {
    console.error('[Reviews] Error rejecting review:', error.message);
    res.status(500).json({ error: 'Failed to reject review' });
  }
};

// POST update review (admin)
export const updateReview = (req, res) => {
  try {
    const { reviewId, name, designation, location, rating, reviewText } = req.body;
    
    const reviewsData = JSON.parse(readFileSync(reviewsFile, 'utf8'));
    const review = reviewsData.reviews.find(r => r.id === reviewId);

    if (!review) {
      return res.status(404).json({ error: 'Review not found' });
    }

    if (name !== undefined) review.name = name;
    if (designation !== undefined) review.designation = designation;
    if (location !== undefined) review.location = location;
    if (rating !== undefined) review.rating = parseInt(rating);
    if (reviewText !== undefined) review.reviewText = reviewText;

    writeFileSync(reviewsFile, JSON.stringify(reviewsData, null, 2));

    res.json({ success: true, message: 'Review updated' });
  } catch (error) {
    console.error('[Reviews] Error updating review:', error.message);
    res.status(500).json({ error: 'Failed to update review' });
  }
};

// DELETE review (admin)
export const deleteReview = (req, res) => {
  try {
    const { reviewId } = req.body;
    
    const reviewsData = JSON.parse(readFileSync(reviewsFile, 'utf8'));
    reviewsData.reviews = reviewsData.reviews.filter(r => r.id !== reviewId);
    writeFileSync(reviewsFile, JSON.stringify(reviewsData, null, 2));

    res.json({ success: true, message: 'Review deleted' });
  } catch (error) {
    console.error('[Reviews] Error deleting review:', error.message);
    res.status(500).json({ error: 'Failed to delete review' });
  }
};

// POST revoke invite (admin)
export const revokeInvite = (req, res) => {
  try {
    const { inviteId } = req.body;
    
    const invitesData = JSON.parse(readFileSync(invitesFile, 'utf8'));
    const invite = invitesData.invites.find(i => i.id === inviteId);

    if (!invite) {
      return res.status(404).json({ error: 'Invite not found' });
    }

    invite.revoked = true;
    writeFileSync(invitesFile, JSON.stringify(invitesData, null, 2));

    res.json({ success: true, message: 'Invite revoked' });
  } catch (error) {
    console.error('[Reviews] Error revoking invite:', error.message);
    res.status(500).json({ error: 'Failed to revoke invite' });
  }
};

// Validate invite token
export const validateInvite = (req, res) => {
  try {
    const { token } = req.params;
    
    const invitesData = JSON.parse(readFileSync(invitesFile, 'utf8'));
    const invite = invitesData.invites.find(i => i.token === token && !i.revoked);

    if (!invite) {
      return res.status(401).json({ valid: false, error: 'Invalid or expired invite' });
    }

    if (invite.usedAt) {
      return res.status(401).json({ valid: false, error: 'This invite has already been used' });
    }

    res.json({ valid: true, email: invite.email });
  } catch (error) {
    console.error('[Reviews] Error validating invite:', error.message);
    res.status(500).json({ error: 'Failed to validate invite' });
  }
};
