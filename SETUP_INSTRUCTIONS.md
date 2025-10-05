# Contact Form Setup Instructions

The contact form is configured to send emails to **sfoerster0722@gmail.com** using Web3Forms.

## Step 1: Get Your Web3Forms Access Key

1. Go to https://web3forms.com
2. Enter your email: **sfoerster0722@gmail.com**
3. Click "Create Access Key"
4. Check your email and verify your access key
5. Copy the access key you receive

## Step 2: Update the Form

1. Open `index.html`
2. Find this line (around line 856):
   ```html
   <input type="hidden" name="access_key" value="YOUR_ACCESS_KEY_HERE">
   ```
3. Replace `YOUR_ACCESS_KEY_HERE` with your actual access key from Web3Forms

## Step 3: Test the Form

1. Visit your website
2. Fill out the contact form
3. Submit it
4. Check **sfoerster0722@gmail.com** for the email

## Features Included

✅ Emails sent to sfoerster0722@gmail.com
✅ Subject line: "New Contact Form Submission - The Prairie Smithville"
✅ Spam protection with hCaptcha
✅ Success message after submission
✅ Form fields: Name, Email, Phone, Message

## Troubleshooting

- If emails aren't arriving, check your spam folder
- Verify the access key is correctly entered in index.html
- Make sure you verified your email with Web3Forms
- Check the browser console for any errors

## Alternative: Use Formspree (if preferred)

If you prefer Formspree instead:
1. Go to https://formspree.io
2. Sign up with sfoerster0722@gmail.com
3. Create a new form
4. Replace the form action in index.html with your Formspree endpoint
