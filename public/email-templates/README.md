# Email Templates Catalog

This directory contains the production-ready responsive email templates for all three learning brands in the platform:

| Brand | Brand Code | Institution | Template File | Primary Theme |
| :--- | :--- | :--- | :--- | :--- |
| **Nexus** | `nexus` | Delta University | [`student-content-available-nexus.html`](./student-content-available-nexus.html) | Deep Emerald & Mint Green |
| **Medway** | `medway` | BUC | [`student-content-available-medway.html`](./student-content-available-medway.html) | Clinical Mint Green |
| **Elite** | `elite` | BUC | [`student-content-available-elite.html`](./student-content-available-elite.html) | Sapphire Navy & Electric Sky Blue |
| **Universal** | *Any* | *Any* | [`student-content-available.html`](./student-content-available.html) | Master Template (Nexus default / variable driven) |

---

## Template Variables

Each template accepts the following interpolation placeholders:

| Variable | Description | Example |
| :--- | :--- | :--- |
| `{{student_name}}` | Recipient student/doctor's name | `Dr. Sarah Jenkins` |
| `{{student_dashboard_url}}` | Direct sign-in / dashboard target link | `https://nexusmed.com/dashboard` |
| `{{support_email}}` | Support desk contact email | `support@nexusmed.com` |
| `{{email_asset_base_url}}` | Base CDN / public assets URL | `https://medwayy.cloud/assets/email` |
| `{{brand_name}}` | *(Universal template)* Brand display name | `Nexus`, `Medway`, `Elite` |
| `{{brand_team_name}}` | *(Universal template)* Team sign-off | `The Nexus Medical Learning Team` |
| `{{brand_logo_url}}` | *(Universal template)* Brand emblem image URL | `{{email_asset_base_url}}/nexus-cross-logo.png` |

---

## Static Assets

All supporting high-DPI (2x Retina) assets and vector SVGs reside in `public/assets/email/`:
- **Logos**: `nexus-cross-logo.png`, `medway-logo.png`, `elite-logo.png` (plus `.svg` equivalents)
- **Hero Artwork**: `medical-stethoscope-books-hero.png` (3D stethoscope resting on textbooks with glowing ECG line and medical cross watermark)
- **Icons & Badges**: Courses play, study book, graduation cap, notification bell, info circle, and festive celebratory CTA rays for all brand palettes
- **Footer Art**: Medical pulse line connecting to a stethoscope (`footer-ecg-stethoscope.png`, `elite-footer-ecg-stethoscope.png`)
