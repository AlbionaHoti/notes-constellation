# 🌌 Constellation

**Transform your scattered Apple Notes into a beautiful, interactive constellation**

Constellation visualizes connections between your thoughts, showing you that your mind already makes sense. See your notes as stars in a cosmic universe, with connections revealing hidden patterns across time and topics.

![Constellation Demo](https://via.placeholder.com/1200x630.png?text=Constellation+Demo)

## ✨ Features

- **🌟 Cosmic Visualization**: Your notes appear as glowing stars in a 3D universe
- **🔗 Intelligent Connections**: AI discovers thematic links between your thoughts
- **🎨 Cluster Colors**: Notes are automatically grouped by theme with distinct colors
- **🎯 Interactive Exploration**:
  - Hover over stars to see them pulse and glow
  - Click stars to read full content
  - Hover over connection lines to see why notes are linked
- **⚡ Lightning Fast**: Works 100% locally - your notes never leave your machine
- **🎭 Beautiful Design**: Glassmorphic UI, smooth animations, cosmic aesthetics

## 🚀 Quick Start

### Prerequisites

- macOS with Apple Notes app
- Node.js 18+ installed
- Some notes in your Apple Notes

### One-Command Setup

```bash
git clone <your-repo-url>
cd constellation/demo
npm install
npm start
```

That's it! The script will:
1. Fetch your Apple Notes automatically
2. Analyze connections with AI (requires API key)
3. Launch the visualization at http://localhost:3000

### Manual Steps

If you prefer to run each step separately:

```bash
# Install dependencies
npm install

# Fetch your notes from Apple Notes
npm run fetch

# Analyze connections (requires ANTHROPIC_API_KEY)
export ANTHROPIC_API_KEY=your_key_here
npm run analyze

# Launch visualization
npm run dev
```

## 🎨 Understanding the Visualization

### Stars (Your Notes)
- Each star represents one note from Apple Notes
- Star colors indicate topic clusters (AI-generated)
- Hover to see a glow effect
- Click to read full content

### Connection Lines
- **Solid colored lines**: Connect notes in the same topic cluster
- **Dashed white lines**: Connect notes across different topics
- **Line opacity**: Indicates connection strength
- Hover over a line to see why those notes are connected

### Clusters
Constellation automatically identifies topic clusters in your notes:
- 🟡 Yellow - AI Systems
- 🌸 Pink - Social Products
- 🌊 Cyan - Privacy & Tech
- 💜 Purple - Creative Philosophy
- 🔵 Blue - Tools & Workflows

*(Your actual clusters will be generated from your notes)*

## 🛠️ Configuration

### API Key Setup

To enable AI-powered connection analysis, you need an Anthropic API key:

1. Get your API key at [console.anthropic.com](https://console.anthropic.com/)
2. Create a `.env` file in the demo directory:
   ```bash
   ANTHROPIC_API_KEY=your_api_key_here
   ```
3. Or export it in your shell:
   ```bash
   export ANTHROPIC_API_KEY=your_api_key_here
   ```

### Customization

**Adjust number of notes fetched:**
Edit `fetch-notes.js` line 30:
```javascript
const limit = Math.min(totalNotes, 50); // Change 50 to your desired limit
```

**Change cluster colors:**
Edit the color palette in `analyze-connections.js` or manually in `data.json`

**Modify connection thresholds:**
Edit `analyze-connections.js` line 94 to change minimum connection strength

## 📁 Project Structure

```
constellation/demo/
├── src/
│   ├── App.jsx              # Main app component
│   ├── Constellation.jsx    # 3D visualization
│   └── main.jsx            # Entry point
├── fetch-notes.js          # AppleScript fetcher
├── analyze-connections.js  # AI connection analyzer
├── data.json              # Generated constellation data
├── raw-notes.json         # Fetched notes (cached)
└── package.json           # Dependencies
```

## 🎯 Use Cases

- **Personal Knowledge Management**: See how your ideas connect over time
- **Creative Exploration**: Discover unexpected links between thoughts
- **Reflection Tool**: Visualize patterns in your thinking
- **Content Creation**: Find themes for writing, videos, or projects
- **Share with Friends**: Invite others to explore shared constellations (coming soon!)

## 🔮 Roadmap

- [ ] Real-time sync with Apple Notes
- [ ] Shared constellations (multi-user)
- [ ] Claude conversation history integration
- [ ] Year in Thoughts report (Spotify Wrapped for your mind)
- [ ] Export as video/image
- [ ] Mobile app (iOS)
- [ ] Public gallery of anonymized constellations

## 🤝 Contributing

This is a local-first tool that respects your privacy. Contributions welcome!

1. Fork the repo
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📝 Privacy

- All notes processing happens **locally** on your machine
- API calls to Anthropic only contain note text for analysis (no identifiers)
- No data is stored externally
- You control your data

## 🎨 Tech Stack

- **React 18** - UI framework
- **Three.js + React Three Fiber** - 3D rendering
- **Vite** - Build tool & dev server
- **AppleScript** - Apple Notes integration
- **Claude API** - AI-powered connection discovery
- **Framer Motion** - Animations (optional)

## 📄 License

MIT License - feel free to use for personal or commercial projects

## 💡 Inspiration

Inspired by the concept of "permission architecture" - creating tools that give people permission to see that their scattered thoughts already make sense.

Your random notes from Tuesday connect to a conversation from Friday. You didn't see it. **Constellation does.**

---

**Built with ❤️ for high frame-rate minds**

Questions? Open an issue or reach out!

## 🌟 Credits

Created by [Your Name](https://github.com/yourusername)
Inspired by the [Karpathy vision](https://twitter.com/karpathy) of technical AI empowerment
