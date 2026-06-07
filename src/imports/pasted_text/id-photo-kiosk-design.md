Create a modern, professional, touch-friendly web application called "ID Photo Kiosk".

The application will be used in a printing shop on iPads, Android tablets, desktop touch screens, and laptops. Customers will take their own ID photo using the device's front camera and generate a print-ready ID photo sheet.

IMPORTANT DESIGN RULES:

* Use Auto Layout everywhere.
* Use responsive constraints everywhere.
* Avoid absolute positioning unless absolutely necessary.
* Use reusable components.
* Use an 8px spacing system.
* Use a 12-column responsive grid.
* Components must scale properly on mobile, tablet, and desktop.
* Design must convert cleanly to React + Tailwind CSS.
* Avoid overlapping elements.
* Avoid fixed heights when possible.
* Use flexible containers.
* Use modern SaaS-quality design patterns.
* Follow accessibility standards.
* Touch targets must be at least 48px.
* Use a clean component hierarchy suitable for code generation.
* Create separate component variants for mobile, tablet, and desktop.
* Use responsive breakpoints:

  * Mobile: 375px
  * Tablet: 768px
  * Desktop: 1440px

DESIGN STYLE:

Create a premium, modern, calming interface.

Visual style:

* Minimalist
* Professional
* Clean
* Friendly
* Easy for non-technical users

Color palette:

* Primary: #2563EB
* Success: #22C55E
* Background: #F8FAFC
* Surface: #FFFFFF
* Text Primary: #0F172A
* Text Secondary: #64748B
* Border: #E2E8F0

Typography:

* Inter font family
* Large readable headings
* High contrast text

Use:

* Rounded corners (16px)
* Soft shadows
* Smooth transitions
* Large buttons
* Large icons
* Clear visual hierarchy

APPLICATION FLOW:

SCREEN 1 - WELCOME SCREEN

Purpose:
Introduce the service.

Layout:

* Logo at top
* Large illustration of ID photo service
* Headline:
  "Professional ID Photos in Minutes"
* Subheading:
  "Take your photo, customize it, and print instantly."
* Large primary button:
  "Start"

Bottom section:

* Small cards showing:

  * Fast Process
  * Professional Quality
  * Instant Printing

SCREEN 2 - PHOTO INSTRUCTIONS

Purpose:
Prepare customer before taking photo.

Display:

* Illustration showing proper positioning
* Tips:

  * Look straight at the camera
  * Keep face centered
  * Use neutral expression
  * Remove hats and sunglasses

Buttons:

* Back
* Continue

SCREEN 3 - CAMERA SCREEN

Purpose:
Capture image.

Layout:

* Full camera preview
* Face guide overlay
* Circular or rectangular framing guide
* Camera status indicator

Controls:

* Switch camera
* Retake
* Capture Photo

Large capture button centered at bottom.

SCREEN 4 - PHOTO REVIEW

Display captured image.

Actions:

* Retake Photo
* Use This Photo

Show zoomed preview.

SCREEN 5 - PHOTO OPTIONS

Card-based selection UI.

SECTION A:
Background Options

Cards:

* Keep Original
* White Background
* Blue Background
* Remove Background

SECTION B:
Attire Options

Cards:

* Original Clothes
* Male Office Attire
* Female Office Attire

SECTION C:
Retouch Options

Toggle switches:

* Face Smoothing
* Brightness Adjustment
* Skin Tone Enhancement

SECTION D:
Print Size

Selectable cards:

* 1x1
* 2x2
* Passport Size
* Mixed Layout

Only one selection active at a time.

SCREEN 6 - LIVE PREVIEW

Purpose:
Show processed result.

Layout:
Two-column responsive design.

Left:
Processed portrait.

Right:
Selected options summary.

Display:

* Background selected
* Attire selected
* Print size selected

Buttons:

* Back
* Generate Print Layout

SCREEN 7 - PRINT LAYOUT PREVIEW

Purpose:
Preview actual photo paper layout.

Show realistic A5 photo paper preview.

Support layouts:

Layout A:
Multiple 2x2 photos

Layout B:
Multiple 1x1 photos

Layout C:
Mixed 1x1 and 2x2 photos

Include:

* Ruler indicators
* Paper dimensions
* Zoom controls

Buttons:

* Edit
* Print

SCREEN 8 - PRINTING SCREEN

Display:

Large animation:
"Preparing Your Print"

Progress indicator

Status messages:

* Removing Background
* Applying Attire
* Generating Layout
* Sending To Printer

SCREEN 9 - SUCCESS SCREEN

Large success icon.

Message:
"Your ID Photo Is Ready"

Buttons:

* Print Another Copy
* Start New Session

Optional:
QR code card

Text:
"Download Your Digital Copy"

ADMIN DASHBOARD

Create separate admin interface.

Sidebar navigation:

* Dashboard
* Orders
* Print History
* Templates
* Settings

Dashboard widgets:

* Total Customers Today
* Total Prints Today
* Revenue Today
* Most Popular Size

Recent Orders Table

Responsive layout.

COMPONENTS TO CREATE

Create reusable components:

* Primary Button
* Secondary Button
* Danger Button
* Card
* Modal
* Dialog
* Sidebar
* Header
* Camera Frame
* Option Card
* Progress Bar
* QR Code Card
* Status Badge
* Step Indicator
* Loading Screen
* Success Screen

DESIGN SYSTEM

Create complete design system page including:

* Colors
* Typography
* Shadows
* Border Radius
* Buttons
* Forms
* Cards
* Icons
* Spacing Rules
* Grid System

OUTPUT REQUIREMENTS

Generate a complete high-fidelity design.

Use Auto Layout throughout.

Ensure exported code structure will be compatible with:

* React
* Tailwind CSS
* TypeScript
* Supabase

All screens must be fully responsive and maintain layout integrity when converted into production code.
