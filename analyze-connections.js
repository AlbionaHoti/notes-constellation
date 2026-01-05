#!/usr/bin/env node

/**
 * Analyze connections between notes using Claude
 * Multi-agent approach: Theme extraction -> Connection finding -> Coordinate mapping
 */

import Anthropic from '@anthropic-ai/sdk';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env file if it exists
const envPath = join(__dirname, '.env');
if (existsSync(envPath)) {
  const envContent = readFileSync(envPath, 'utf-8');
  envContent.split('\n').forEach(line => {
    const [key, ...valueParts] = line.split('=');
    if (key && valueParts.length) {
      process.env[key.trim()] = valueParts.join('=').trim();
    }
  });
}

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Extract JSON from Claude's response (handles markdown code blocks)
function extractJSON(text) {
  // Try to find JSON within markdown code blocks
  let cleaned = text.trim();

  // Remove opening code fence
  cleaned = cleaned.replace(/^```(?:json)?\s*\n?/, '');

  // Remove closing code fence
  cleaned = cleaned.replace(/\n?```\s*$/, '');

  return cleaned.trim();
}

// CRITICAL: Clean and redact sensitive information from notes
function cleanAndSecureText(text) {
  if (!text) return '';

  // Remove invalid Unicode surrogate pairs
  let cleaned = text.replace(/[\uD800-\uDFFF]/g, '');

  // Redact API keys (various formats)
  cleaned = cleaned.replace(/sk-[a-zA-Z0-9]{20,}/g, '[REDACTED_API_KEY]');
  cleaned = cleaned.replace(/ANTHROPIC_API_KEY\s*[=:]\s*[^\s]+/gi, 'ANTHROPIC_API_KEY=[REDACTED]');
  cleaned = cleaned.replace(/OPENAI_API_KEY\s*[=:]\s*[^\s]+/gi, 'OPENAI_API_KEY=[REDACTED]');
  cleaned = cleaned.replace(/API_KEY\s*[=:]\s*[^\s]+/gi, 'API_KEY=[REDACTED]');
  cleaned = cleaned.replace(/apikey\s*[=:]\s*[^\s]+/gi, 'apikey=[REDACTED]');

  // Redact passwords
  cleaned = cleaned.replace(/password\s*[=:]\s*[^\s]+/gi, 'password=[REDACTED]');
  cleaned = cleaned.replace(/passwd\s*[=:]\s*[^\s]+/gi, 'passwd=[REDACTED]');
  cleaned = cleaned.replace(/pwd\s*[=:]\s*[^\s]+/gi, 'pwd=[REDACTED]');

  // Redact tokens
  cleaned = cleaned.replace(/token\s*[=:]\s*[^\s]+/gi, 'token=[REDACTED]');
  cleaned = cleaned.replace(/access_token\s*[=:]\s*[^\s]+/gi, 'access_token=[REDACTED]');
  cleaned = cleaned.replace(/bearer\s+[a-zA-Z0-9_\-\.]+/gi, 'bearer [REDACTED]');

  // Redact secrets
  cleaned = cleaned.replace(/secret\s*[=:]\s*[^\s]+/gi, 'secret=[REDACTED]');
  cleaned = cleaned.replace(/client_secret\s*[=:]\s*[^\s]+/gi, 'client_secret=[REDACTED]');

  // Redact credit cards (basic pattern)
  cleaned = cleaned.replace(/\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g, '[REDACTED_CC]');

  // Redact SSH keys
  cleaned = cleaned.replace(/-----BEGIN (?:RSA|DSA|EC|OPENSSH) PRIVATE KEY-----[\s\S]*?-----END (?:RSA|DSA|EC|OPENSSH) PRIVATE KEY-----/g, '[REDACTED_SSH_KEY]');

  // Redact database connection strings
  cleaned = cleaned.replace(/(?:mongodb|postgres|mysql|redis):\/\/[^\s]+/gi, '[REDACTED_DB_CONNECTION]');

  // Redact AWS keys
  cleaned = cleaned.replace(/AKIA[0-9A-Z]{16}/g, '[REDACTED_AWS_KEY]');

  // Redact JWT tokens
  cleaned = cleaned.replace(/eyJ[a-zA-Z0-9_-]*\.eyJ[a-zA-Z0-9_-]*\.[a-zA-Z0-9_-]*/g, '[REDACTED_JWT]');

  return cleaned;
}

async function analyzeConnections() {
  console.log('🔍 Analyzing connections between notes...\n');

  // Load raw notes
  const rawNotesPath = join(__dirname, 'raw-notes.json');
  let rawData;

  try {
    rawData = JSON.parse(readFileSync(rawNotesPath, 'utf-8'));
  } catch (err) {
    console.error('❌ Error: raw-notes.json not found. Run "npm run fetch" first.');
    process.exit(1);
  }

  const notes = rawData.notes;
  console.log(`📊 Analyzing ${notes.length} notes...\n`);

  // Step 1: Extract themes from each note
  console.log('1️⃣  Extracting themes...');
  const notesWithThemes = await extractThemes(notes);

  // Step 2: Find connections between notes
  console.log('2️⃣  Finding connections...');
  const connections = await findConnections(notesWithThemes);

  // Step 3: Map to 3D coordinates
  console.log('3️⃣  Mapping constellation coordinates...');
  const constellation = await mapCoordinates(notesWithThemes, connections);

  // Save constellation data
  const outputPath = join(__dirname, 'data.json');
  writeFileSync(outputPath, JSON.stringify(constellation, null, 2));

  console.log(`\n✅ Constellation generated with ${constellation.stars.length} stars and ${constellation.connections.length} connections`);
  console.log(`💾 Saved to data.json`);
  console.log(`\n🚀 Next: Run "npm run dev" to visualize your constellation\n`);
}

async function extractThemes(notes) {
  // Process in batches to avoid context limits
  const batchSize = 100;
  const allThemes = [];

  for (let i = 0; i < notes.length; i += batchSize) {
    const batch = notes.slice(i, i + batchSize);
    console.log(`   Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(notes.length / batchSize)} (${batch.length} notes)...`);

    const prompt = `You are a theme extraction agent. Analyze these notes and classify them into these specific clusters:

**CLUSTERS:**
1. AI Systems - AI tools, automation, Claude, machine learning
2. Social Products - Social apps, community, connections, relationships
3. Privacy & Tech - Security, privacy, data protection, encryption
4. Creative Philosophy - Creativity, art, thinking, reflection
5. Tools & Workflows - Productivity, systems, processes, organization

**Notes:**
${batch.map((n, idx) => `${idx + 1}. ${cleanAndSecureText(n.content).substring(0, 200)}`).join('\n\n')}

For each note, assign it to the BEST matching cluster and extract themes.
Return ONLY a JSON array with ${batch.length} objects: [{ cluster: "AI Systems", themes: ["AI", "tools"], concept: "brief concept" }]`;

    const response = await client.messages.create({
      model: 'claude-sonnet-4-5-20250929', // Faster model for large-scale processing
      max_tokens: 16000,
      messages: [{ role: 'user', content: prompt }]
    });

    const extracted = extractJSON(response.content[0].text);
    const batchThemes = JSON.parse(extracted);
    allThemes.push(...batchThemes);
  }

  // Map clusters to colors
  const clusterColors = {
    "AI Systems": "#fbbf24",
    "Social Products": "#ec4899",
    "Privacy & Tech": "#22d3ee",
    "Creative Philosophy": "#a78bfa",
    "Tools & Workflows": "#06b6d4"
  };

  return notes.map((note, i) => ({
    ...note,
    cluster: allThemes[i].cluster,
    color: clusterColors[allThemes[i].cluster] || "#fbbf24",
    ...allThemes[i]
  }));
}

async function findConnections(notes) {
  // For large note sets, use algorithmic connection finding based on themes
  console.log('   Finding connections based on shared themes and clusters...');

  const connections = [];

  // Calculate theme similarity between notes
  function calculateSimilarity(note1, note2) {
    const themes1 = new Set(note1.themes);
    const themes2 = new Set(note2.themes);
    const intersection = [...themes1].filter(t => themes2.has(t)).length;
    const union = new Set([...themes1, ...themes2]).size;
    return union > 0 ? intersection / union : 0;
  }

  // Find connections within same cluster (strong connections)
  const clusterGroups = {};
  notes.forEach((note, i) => {
    if (!clusterGroups[note.cluster]) clusterGroups[note.cluster] = [];
    clusterGroups[note.cluster].push(i);
  });

  Object.values(clusterGroups).forEach(indices => {
    // Connect each note to its 3 most similar cluster-mates
    indices.forEach(i => {
      const similarities = indices
        .filter(j => j !== i)
        .map(j => ({
          to: j,
          similarity: calculateSimilarity(notes[i], notes[j]),
          reason: `Both explore ${notes[i].themes.slice(0, 2).join(' and ')}`
        }))
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, 3);

      similarities.forEach(({ to, similarity, reason }) => {
        if (similarity > 0.3) {
          connections.push({
            from: i,
            to,
            reason,
            strength: similarity
          });
        }
      });
    });
  });

  // Find cross-cluster connections (bridges)
  for (let i = 0; i < notes.length; i++) {
    for (let j = i + 1; j < notes.length; j++) {
      if (notes[i].cluster !== notes[j].cluster) {
        const similarity = calculateSimilarity(notes[i], notes[j]);
        if (similarity > 0.5) { // Higher threshold for cross-cluster
          connections.push({
            from: i,
            to: j,
            reason: `Bridge between ${notes[i].cluster} and ${notes[j].cluster}`,
            strength: similarity
          });
        }
      }
    }
  }

  console.log(`   Found ${connections.length} connections`);
  return connections;
}

async function mapCoordinates(notes, connections) {
  // Simple force-directed layout simulation
  // Stars closer to connected stars

  const stars = notes.map((note, i) => ({
    id: i,
    content: cleanAndSecureText(note.content),
    themes: note.themes,
    source: note.source,
    position: {
      x: (Math.random() - 0.5) * 10,
      y: (Math.random() - 0.5) * 10,
      z: (Math.random() - 0.5) * 10
    },
    color: note.source === 'apple-notes' ? '#fbbf24' : '#22d3ee'
  }));

  // Simple spring simulation for layout
  for (let iter = 0; iter < 50; iter++) {
    connections.forEach(conn => {
      const star1 = stars[conn.from];
      const star2 = stars[conn.to];

      const dx = star2.position.x - star1.position.x;
      const dy = star2.position.y - star1.position.y;
      const dz = star2.position.z - star1.position.z;

      const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
      const force = (distance - 2) * 0.1 * conn.strength;

      star1.position.x += dx * force * 0.01;
      star1.position.y += dy * force * 0.01;
      star1.position.z += dz * force * 0.01;

      star2.position.x -= dx * force * 0.01;
      star2.position.y -= dy * force * 0.01;
      star2.position.z -= dz * force * 0.01;
    });
  }

  return {
    stars,
    connections,
    metadata: {
      generated_at: new Date().toISOString(),
      total_notes: notes.length,
      total_connections: connections.length
    }
  };
}

analyzeConnections().catch(console.error);
