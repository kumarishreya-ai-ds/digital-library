# Ganesh Student Flow

Build a professional, production-style website for a real local study library called:

“श्री गणेश लाइब्रेरी”

English: “Shri Ganesh Library”

This is NOT a generic AI demo website. It is a real-world library entry and payment management website. The design should feel like it was professionally made for an actual local library, with a trustworthy, simple and practical Indian local-business feel.

IMPORTANT:

Do not make the website look like an AI-generated template.

Avoid excessive gradients, unnecessary animations, futuristic AI visuals, fake statistics, fake testimonials, or generic startup sections.

Keep it clean, realistic, fast and easy for students to use.

==================================================

BRANDING

==================================================

Use the provided library advertisement as the main branding reference.

Library Name:

श्री गणेश लाइब्रेरी

Tagline:

“नया रूप, नई सुविधाएं!”

Location/Building text:

“खुद्रा लाइट ऑफ इंडिया भवन”

Contact:

9852688787

Facilities shown in the advertisement:

- AC / Cooler

- CCTV

- Free Wi-Fi

- Comfortable Study Environment

- Spacious Study Area

The website should visually match the advertisement's traditional + professional feel.

Use Hindi prominently, with English where useful.

==================================================

HOME PAGE

==================================================

Create a simple homepage with:

Header:

- Shri Ganesh Library logo/name

- Home

- Entry

- Payment

- Contact

Hero section:

“श्री गणेश लाइब्रेरी”

“नया रूप, नई सुविधाएं!”

Subtext:

“शांत, सुरक्षित और सुविधाजनक अध्ययन वातावरण”

Primary CTA:

“Entry Book करें”

Secondary CTA:

“Contact करें”

Show library facilities:

- AC / Cooler

- CCTV Security

- Free Wi-Fi

- Comfortable Seating

- शांत अध्ययन वातावरण

Contact number:

9852688787

==================================================

STUDENT ENTRY SYSTEM

==================================================

Create a page:

“Library Entry”

Student must enter:

1. Full Name

2. Mobile Number

3. Select Entry Type:

   - Half Day

   - Full Day

4. Select date

5. Select preferred entry time

Do proper form validation.

Do not allow empty or invalid fields.

After submission show a confirmation summary.

==================================================

PAYMENT SYSTEM

==================================================

Create a real payment section.

Show:

“Select Payment Type”

[ Half Day ]

[ Full Day ]

Display the actual price dynamically.

IMPORTANT:

Do NOT create fake payment processing.

The payment system must be designed so the library owner can connect their REAL UPI ID / UPI QR code.

Create an Admin Payment Settings section where the owner can enter:

- UPI ID

- Payment receiver name

- Half Day price

- Full Day price

- QR code image

Generate/display a proper UPI payment QR using the configured REAL UPI ID.

Also provide:

“Pay using UPI”

button.

For mobile users, provide a UPI deep-link option when supported.

After payment, ask the student to enter:

- UTR / Transaction ID

- Payment screenshot (optional)

Then show:

“Payment submitted for verification.”

DO NOT automatically claim that payment is successful merely because the student clicked a button.

==================================================

PAYMENT VERIFICATION

==================================================

Create an Admin Dashboard.

Admin can see:

- Student name

- Mobile number

- Date

- Entry type

- Amount

- UTR/Transaction ID

- Payment screenshot

- Payment status

Statuses:

Pending

Verified

Rejected

Admin can click:

[Verify Payment]

[Reject Payment]

Only after verification should the entry become:

“Confirmed”

==================================================

ENTRY PASS

==================================================

After successful admin verification, generate a digital entry pass.

Show:

SHRI GANESH LIBRARY

Student Name

Entry Type

Date

Entry Time

Payment Status: VERIFIED

Generate a unique Entry ID.

Example:

SGL-2026-00001

Generate a QR code containing ONLY the entry ID / verification information, not sensitive payment information.

Allow student to show this QR code at the library entrance.

==================================================

ADMIN DASHBOARD

==================================================

Create secure admin login.

Dashboard should show:

Today's Entries

Pending Payments

Verified Payments

Today's Revenue

Half Day Entries

Full Day Entries

Create tables for:

Students

Entries

Payments

Admin should be able to:

- Search student

- Search mobile number

- Search Entry ID

- Filter by date

- Filter by payment status

- Verify/reject payment

- View payment screenshot

- Export entry records as CSV

==================================================

DATABASE

==================================================

Use Supabase for:

Authentication

Database

Storage

Create tables:

students

entries

payments

admin_settings

Relationships should be properly designed.

Store payment screenshots securely.

Do not expose private admin information to normal users.

==================================================

ANTI-FRAUD / REAL-WORLD LOGIC

==================================================

Implement:

- Unique Entry ID

- Unique transaction/UTR validation where possible

- Payment status workflow

- Admin verification

- Duplicate submission protection

- Form validation

- Secure admin authentication

Never mark a payment as VERIFIED automatically just because a form was submitted.

==================================================

DESIGN

==================================================

Make the website look like a genuine local library website.

Use:

- White/light background

- Professional dark text

- Gold/yellow accent inspired by the advertisement

- Subtle traditional Indian visual identity

- Clean cards

- Simple navigation

- Realistic typography

- No excessive rounded futuristic cards

- No unnecessary animations

The website must work perfectly on mobile because students will mostly use phones.

==================================================

IMPORTANT BUSINESS DETAILS

==================================================

Do NOT invent:

- Library address

- Prices

- Timings

- UPI ID

- Owner name

- Email

- Reviews

- Student counts

If any of these are unknown, create editable fields in the Admin Settings.

For prices, initially show:

“Price will be configured by the library administrator.”

For UPI:

“UPI payment details will be configured by the administrator.”

Do not use fake QR codes.

==================================================

QR PAYMENT

==================================================

The QR code must be generated from the REAL UPI ID entered by the administrator.

The admin should be able to replace the QR code anytime.

Do not hardcode a dummy UPI ID.

Payment amount should be included in the UPI payment request only after the admin configures the actual price.

==================================================

PRODUCTION QUALITY

==================================================

The website should have:

- Proper error handling

- Loading states

- Empty states

- Mobile responsiveness

- Secure authentication

- Database persistence

- Form validation

- Accessible buttons/forms

- Clean component structure

- Environment variables for secrets/API keys

- No hardcoded credentials

- No fake data presented as real

Build it as a real deployable application, not a visual prototype.

Before finishing, test:

1. Student registration

2. Half Day selection

3. Full Day selection

4. Payment submission

5. UTR submission

6. Admin login

7. Payment verification

8. Entry pass generation

9. QR generation

10. Mobile responsiveness

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://ganesh-student-flow.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/f3babbac-6da8-44c9-8001-80d322d3cb37).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
