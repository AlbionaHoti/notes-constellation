#!/usr/bin/env node

/**
 * Analyze connections between notes using Claude
 * Multi-agent approach: Theme extraction -> Connection finding -> Coordinate mapping
 */

import Anthropic from '@anthropic-ai/sdk';
import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

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
  const prompt = `You are a theme extraction agent. Analyze these notes and identify key themes, emotions, and concepts.

Notes:
${notes.map((n, i) => `${i + 1}. ${n.content}`).join('\n')}

For each note, extract:
- Main themes (2-3 keywords)
- Emotional tone
- Core concept

Return JSON array matching the note order with: { themes: [], emotion: "", concept: "" }`;

  const response = await client.messages.create({
    model: 'claude-sonnet-4-5-20250929',
    max_tokens: 2000,
    messages: [{ role: 'user', content: prompt }]
  });

  const themesData = JSON.parse(response.content[0].text);

  return notes.map((note, i) => ({
    ...note,
    ...themesData[i]
  }));
}

async function findConnections(notes) {
  const prompt = `You are a connection discovery agent. Find hidden connections between these notes.

Notes:
${notes.map((n, i) => `${i + 1}. ${n.content}\n   Themes: ${n.themes.join(', ')}\n   Concept: ${n.concept}`).join('\n\n')}

Find thematic, conceptual, and emotional connections. Return JSON array:
[{ from: 0, to: 1, reason: "why connected", strength: 0-1 }]

Only include meaningful connections (strength > 0.3).`;

  const response = await client.messages.create({
    model: 'claude-sonnet-4-5-20250929',
    max_tokens: 2000,
    messages: [{ role: 'user', content: prompt }]
  });

  return JSON.parse(response.content[0].text);
}

async function mapCoordinates(notes, connections) {
  // Simple force-directed layout simulation
  // Stars closer to connected stars

  const stars = notes.map((note, i) => ({
    id: i,
    content: note.content,
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
