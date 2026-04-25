# HealthBizHub Chatbot Widget

AI-powered chat widget for the HealthBizHub health business directory. Connects to the n8n backend via webhook and renders rich UI responses (cards, image sliders, testimonials, category pickers, and more).

---

## Files

| File | Purpose |
|------|---------|
| `index.html` | Standalone full-page chat interface |
| `widget.js` | Embeddable floating bubble widget (IIFE) |
| `widget.css` | All styles (used by widget.js via CDN link) |

---

## Option 1 — Standalone Page

Open `index.html` directly in a browser, or host it on any static server. No dependencies required — all CSS is inlined.

---

## Option 2 — Floating Bubble Widget

### Step 1: Host the files

Upload `widget.js` and `widget.css` to your CDN or static hosting (e.g. your healthbizhub.com public folder).

### Step 2: Update the CSS URL in widget.js

Open `widget.js` and update line 4:

```js
var CSS_URL = 'https://www.healthbizhub.com/chatbot/widget.css';
```

### Step 3: Embed on any page

Add this single script tag before `</body>`:

```html
<script src="https://www.healthbizhub.com/chatbot/widget.js" defer></script>
```

That's it. The floating chat bubble will appear in the bottom-right corner of the page.

---

## Webhook Configuration

Both files point to the n8n webhook:

```
http://82.25.104.70:5678/webhook/healthbizhub-chat
```

To change the endpoint, update `WEBHOOK_URL` at the top of both `widget.js` and the inline `<script>` block in `index.html`.

---

## Response Types Rendered

| `response_type` | UI Component |
|----------------|-------------|
| `text` | Plain text message bubble |
| `cards` | Business cards with photo, badges, profile link |
| `category_picker` | Clickable category pill buttons |
| `image_slider` | Photo carousel with prev/next controls |
| `testimonial_cards` | Review cards with amber left border |
| `post_type_picker` | Post type buttons with counts |
| `links` | Social/website link list |

---

## Branding

Colors are defined as CSS variables in `widget.css` (and inlined in `index.html`):

```css
--hbh-primary:   #00BCD4   /* teal */
--hbh-secondary: #F5A623   /* amber */
--hbh-dark:      #1a2332   /* background */
```

Change these to restyle the entire widget without touching component code.
