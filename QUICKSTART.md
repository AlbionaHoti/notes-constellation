# 🚀 Quick Start

Get your constellation running in **under 2 minutes**.

## Prerequisites
- macOS with Apple Notes
- Node.js 18+
- Some notes in Apple Notes

## One-Command Setup

```bash
git clone https://github.com/yourusername/notes-constellation.git
cd notes-constellation
npm install
npm start
```

Done! Opens at http://localhost:3000

## What It Does

1. **Fetches** your Apple Notes (via AppleScript - 100% local)
2. **Analyzes** connections with Claude AI
3. **Visualizes** as an interactive 3D constellation

## If You Get Errors

**"API key not found":**
```bash
cp .env.example .env
# Edit .env and add your ANTHROPIC_API_KEY
```

**"No notes fetched":**
- Check Apple Notes has some notes
- Grant terminal permissions if prompted

## Manual Steps

```bash
# 1. Install
npm install

# 2. Fetch notes
npm run fetch

# 3. Analyze (needs API key)
export ANTHROPIC_API_KEY=your_key
npm run analyze

# 4. View
npm run dev
```

## What You'll See

- **Stars**: Each note is a glowing sphere
- **Colors**: Different topics get different colors
- **Lines**: AI-found connections between notes
- **Interactions**:
  - Hover stars → they pulse
  - Click stars → read full note
  - Hover lines → see why connected

## Future: Share with Friends

Coming soon: Generate an invite code, share with a friend, see your constellations merge and discover surprising connections.

---

**Built for high frame-rate minds. Your scattered thoughts already make sense.**
