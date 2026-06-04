Product Blueprint for Sponsa

---

🧠 App Overview & Objective

Sponsa is a web-based tipping platform designed for Indian YouTube Live streamers. It allows viewers to support creators through UPI payments, avoiding high commissions like YouTube Super Chat’s 30%. Creators receive tips in real time, with the platform taking a 5–10% fee per transaction. Tips are stored in a wallet system, giving creators control over when and how to withdraw their earnings or use them for other platform tools in the future.

---

🎯 Target Audience

* Primary Users: YouTube Live streamers in India
* Size: Any subscriber count — open to large and small creators
* Use Case: Creators who want to monetize live streams with lower fees and a better experience

---

🛠️ Core Features & Functionality

For Creators:

* Signup/Login Dashboard
* "Start Sponsa" button to simulate new session (re-uses same link)
* Unique, permanent Sponsa link (e.g., `sponsa.in/ronak`)
* Real-time donation feed (with name, amount, message)
* Wallet system to track net earnings (after platform cut)
* Manual UPI withdrawal
* OBS-compatible overlay (browser source):

   Displays: “Raj sent ₹100”*
  * No public messages on stream
  * Future: basic theme customization

For Viewers:

* Click creator’s Sponsa link
* Enter name, donation amount, and optional message
* Pay using UPI (QR, ID, or payment gateway)
* Message shown only in creator dashboard

---

🏗️ High-Level Tech Stack (Recommendation)

| Layer         | Suggested Tools                                                 |
| ------------- | --------------------------------------------------------------- |
| Frontend  | React.js (Next.js optional for SSR), Tailwind CSS               |
| Backend   | Node.js (Express), or Firebase for fast MVP                     |
| Real-Time | WebSockets (Socket.IO) or Firebase Realtime DB                  |
| Database  | Firestore or PostgreSQL (ephemeral support + wallet tracking)   |
| Payments  | Razorpay, Paytm for Business, or Cashfree (UPI + split payouts) |
| Overlay   | HTML/CSS rendered as browser source for OBS integration         |
| Auth      | Email + OAuth (Google sign-in for YouTubers)                    |
| Hosting   | Vercel or Firebase Hosting for MVP simplicity                   |

---

🧱 Conceptual Data Model

Users (Creators)

* `id`
* `email`
* `name`
* `upi_id`
* `wallet_balance`
* `created_at`

Tips

* `id`
* `creator_id`
* `donor_name`
* `message` (optional)
* `amount`
* `timestamp`
* `session_id` (optional)
* Auto-expiry/purge after 72 hrs

Withdrawals

* `id`
* `creator_id`
* `amount`
* `upi_id`
* `status`
* `requested_at`

---

🎨 User Interface Design Principles

* Clean, distraction-free dashboard
* Dark mode support (streamers love it)
* Emphasis on “copy link,” “see live tips,” “wallet balance”
* Simple call-to-action flow for viewers
* Browser source overlay should be plug-and-play

---

🔐 Security Considerations

* Use secure UPI payment gateways — never handle sensitive UPI credentials directly
* Rate limiting and anti-spam for donation inputs
* Token-based auth sessions (JWT or Firebase auth)
* Payout validation to avoid accidental or duplicate withdrawals
* Sanitization of viewer inputs (donor name, message)

---

🚀 Development Phases & Milestones

Phase 1 – MVP

* Creator sign-up/login
* Dashboard with real-time tip feed
* UPI donation flow via Razorpay
* Wallet with manual withdrawal
* Overlay integration (basic theme)
* Static, permanent tipping link

Phase 2 – Polish & Stability

* Overlay customization (theme, animation, sound)
* KYC flow for verified payouts
* Success/failure reporting system for payments

Phase 3 – Future Features

* Creator tools (clip marker bot, editor tools)
* API access for creators or bots
* Fan leaderboard or donor insights
* Spending wallet balance on platform features
* Mobile app version (progressive or native)

---

🧩 Potential Challenges & Suggested Solutions

| Challenge                     | Solution                                                     |
| ----------------------------- | ------------------------------------------------------------ |
| Managing UPI flow securely    | Use trusted PGs like Razorpay with split payment support     |
| Streaming tool compatibility  | Stick to browser-source overlays for OBS, Streamlabs         |
| Real-time updates performance | Firebase or Socket.IO with throttled event push              |
| Wallet management risk        | Use auto-balance updates on successful payment confirmations |
| Scaling donations             | Queue/message brokers (Phase 2+) if high concurrent viewers  |

---

🌱 Future Expansion Possibilities

* Support for Twitch, Facebook Live, Instagram Live
* Creator storefronts (courses, shoutouts, merch)
* SaaS model for advanced creator tools
* AI-powered auto-clipping / highlights
* Sponsorship marketplace for brands to discover streamers

---

That’s your `sponsa.md` blueprint! 🚀
Would you like me to help turn this into a formatted PDF or Notion doc as well? And feel free to suggest edits — I’m happy to revise any section if needed.


YouTuber Onboarding and Setup Flow:

1.  Initial Contact & Interest:
    * You, as Sponsa, would reach out to a YouTuber (or they discover Sponsa).
    * They express interest in understanding how it works.

2.  Sponsa Landing Page / Marketing Site:
    * Purpose: Introduce Sponsa, highlight benefits (lower fees than Super Chat, real-time tips, wallet system), explain the problem it solves, and provide a clear Call-to-Action (CTA).
    * Content: "Why Sponsa," "How it Works," "Features," "Pricing (5-10% fee)," "Testimonials (future)," "FAQ."
    * CTA: "Get Started," "Sign Up," or "Learn More."

3.  Creator Signup/Login Page:
    * Purpose: Allow new creators to register or existing creators to log in.
    * Authentication: Email/password combined with OAuth (Google Sign-in is highly recommended for YouTubers for ease of use and associating with their YouTube channel).
    * Action: Upon successful signup/login, redirect to the Creator Dashboard.

4.  Creator Dashboard:
    * Purpose: The central hub for the creator to manage their Sponsa account and live streams.
    * Key Elements:
        * Permanent Sponsa Link Display: Clearly shows their unique, permanent tipping link (e.g., `sponsa.in/ronak`) with a prominent "Copy Link" button.
        * "Start Sponsa" Button: Simulates a new tipping session, allowing them to test and re-use the same link for different streams.
        * Real-time Donation Feed: A live stream of incoming tips (donor name, amount, and message), visible only to the creator.
        * Wallet Balance Display: Shows their current net earnings after Sponsa's cut.
        * "Withdraw Funds" Button: Initiates the withdrawal process.
        * OBS Overlay Configuration: Instructions and a link to their OBS-compatible browser source URL. (Future: basic theme customization options for the overlay).
        * Settings/Profile: To update UPI ID for withdrawals, change email, etc..

5.  Withdrawal Page/Modal (within Dashboard):
    * Purpose: To allow creators to initiate a payout to their UPI ID.
    * Elements:
        * Display current wallet balance.
        * Input field for withdrawal amount.
        * Confirmation of linked UPI ID (or an option to add/update it).
        * "Confirm Withdrawal" button.
        * Status updates for past withdrawals.

6.  OBS Overlay (Browser Source):
    * Purpose: This isn't a "website" in the traditional sense, but a dynamic HTML/CSS page rendered within OBS or Streamlabs as a browser source.
    * Content: Displays real-time tip notifications like "Raj sent ₹100".
    * Characteristics: No public messages on stream (only in creator dashboard), future basic theme customization. This page needs to securely receive data (via WebSockets or Firebase Realtime DB) to display the tip.

Viewer Tipping Flow:

1.  Creator Shares Sponsa Link:
    * The creator shares their unique Sponsa link in their YouTube Live stream description, chat, or pinned comment.

2.  Viewer Tipping Page (Public Facing):
    * Purpose: This is the page viewers land on when they click the creator's Sponsa link.
    * Design Principles: Simple, clean, and a clear call-to-action for donation.
    * Elements:
        * Creator's name/channel art (to confirm they're on the right page).
        * Input field for "Your Name".
        * Input field for "Donation Amount".
        * Optional "Message" text area (clearly stating this message is only visible to the creator).
        * "Pay with UPI" button.
    * Action: Submitting this form triggers the payment gateway integration.

3.  Payment Gateway Integration (Razorpay, Paytm for Business, Cashfree):
    * Purpose: To handle the actual UPI payment process securely.
    * Flow:
        * Viewer clicks "Pay with UPI."
        * The payment gateway interface appears (either a redirect or an overlay/modal).
        * Viewer chooses UPI method (QR code, UPI ID, or payment app redirect).
        * Viewer completes the payment in their UPI app.
        * Upon successful payment, the payment gateway notifies Sponsa's backend (via webhooks).

4.  Confirmation/Thank You Page (for Viewer):
    * Purpose: A simple page thanking the viewer for their donation.
    * Content: "Thank you for supporting [Creator's Name]!"

This covers all the essential web pages and the interaction flow for both creators and viewers.