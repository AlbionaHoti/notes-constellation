#!/bin/bash

# Constellation Pipeline with Sub-Agents
# This script orchestrates the full constellation generation using multiple specialized agents

echo "🌌 Constellation Pipeline with Sub-Agents"
echo "==========================================="
echo ""

# Step 1: Fetch notes
echo "📝 Step 1: Fetching notes from Apple Notes..."
npm run fetch
if [ $? -ne 0 ]; then
    echo "❌ Failed to fetch notes"
    exit 1
fi
echo "✅ Notes fetched"
echo ""

# Step 2: Run bid_connection agent (clustering)
echo "🔗 Step 2: Running bid_connection agent (finding topic clusters)..."
echo "   Agent: Analyzing themes and creating clusters..."

claude --agent agents/bid-connection-agent.md <<EOF
Read raw-notes.json and create topic clusters.
Find bids for connection between notes.
Output to cluster-data.json
EOF

echo "✅ Topic clusters created"
echo ""

# Step 3: Run theme_cluster agent (dynamic themes)
echo "🎨 Step 3: Running theme_cluster agent (organizing themes)..."
echo "   Agent: Building theme hierarchy..."

claude --agent agents/theme-cluster-agent.md <<EOF
Read cluster-data.json and create dynamic theme structure.
Track emerging themes and cluster evolution.
Output to theme-state.json
EOF

echo "✅ Theme structure ready"
echo ""

# Step 4: Analyze connections with Claude API
echo "🔍 Step 4: Analyzing connections with Claude API..."
npm run analyze
if [ $? -ne 0 ]; then
    echo "❌ Failed to analyze connections"
    exit 1
fi
echo "✅ Connections analyzed"
echo ""

# Step 5: Launch visualization
echo "🚀 Step 5: Launching constellation..."
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  ✨ Your constellation is ready!"
echo "  📊 $(cat raw-notes.json | grep -c '"id":') notes visualized"
echo "  🔗 $(cat data.json | jq '.connections | length' 2>/dev/null || echo "?") connections found"
echo "  🎨 Topic clusters: bid-based"
echo "  🔄 Auto-refresh: enabled"
echo ""
echo "  Opening http://localhost:3000"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

npm run dev
