#!/usr/bin/env node

/**
 * Fetch notes from Apple Notes using AppleScript
 * Works instantly on macOS - no configuration needed
 */

import { execSync } from 'child_process';
import { writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function fetchNotes() {
  console.log('🌟 Fetching notes from Apple Notes...\n');

  try {
    console.log('📝 Reading from Apple Notes...');

    // Simpler approach: Get note count first, then fetch individually
    const countScript = `tell application "Notes" to count notes`;
    const countResult = execSync(`osascript -e '${countScript}'`, { encoding: 'utf-8' });
    const totalNotes = parseInt(countResult.trim());

    console.log(`📊 Found ${totalNotes} total notes, fetching all in batches...\n`);

    const notes = [];
    const batchSize = 10; // Process 10 notes at a time
    const limit = totalNotes;

    // Batch processing for speed
    for (let batch = 0; batch < Math.ceil(limit / batchSize); batch++) {
      const start = batch * batchSize + 1;
      const end = Math.min((batch + 1) * batchSize, limit);

      console.log(`  📦 Batch ${batch + 1}/${Math.ceil(limit / batchSize)}: Notes ${start}-${end}`);

      // Process batch in parallel
      const batchPromises = [];
      for (let i = start; i <= end; i++) {
        batchPromises.push(
          new Promise((resolve) => {
            try {
              const noteScript = `
                tell application "Notes"
                  set theNote to note ${i}
                  set noteText to body of theNote as text
                  set noteDate to modification date of theNote as text
                  set noteAttachments to count of attachments of theNote
                  return noteText & "|||DIVIDER|||" & noteDate & "|||DIVIDER|||" & noteAttachments
                end tell
              `;

              const result = execSync(`osascript -e '${noteScript.replace(/'/g, "'\"'\"'")}'`, {
                encoding: 'utf-8',
                maxBuffer: 2 * 1024 * 1024, // 2MB buffer
                timeout: 10000 // 10 second timeout per note
              }).trim();

              const parts = result.split('|||DIVIDER|||');
              const [content, dateStr, attachmentCount] = parts;

              if (!content || content.trim().length === 0) {
                resolve(null);
                return;
              }

              // Extract URLs before cleaning HTML
              const urlRegex = /(https?:\/\/[^\s<>"]+)/g;
              const urls = content.match(urlRegex) || [];

              // Clean HTML but preserve structure
              const cleanContent = content
                .substring(0, 10000)
                .replace(/<br>/g, '\n')
                .replace(/<[^>]*>/g, ' ')
                .replace(/&amp;/g, '&')
                .replace(/&lt;/g, '<')
                .replace(/&gt;/g, '>')
                .replace(/&quot;/g, '"')
                .replace(/\s+/g, ' ')
                .replace(/\n\s+/g, '\n')
                .trim();

              if (cleanContent.length >= 10) {
                let parsedDate;
                try {
                  parsedDate = new Date(dateStr).toISOString();
                } catch {
                  parsedDate = new Date().toISOString();
                }

                const note = {
                  id: `note-${i}`,
                  content: cleanContent.substring(0, 500),
                  created_at: parsedDate,
                  source: 'apple-notes',
                  folder: 'Notes'
                };

                if (urls.length > 0) {
                  note.urls = urls.slice(0, 5);
                }

                const attachCount = parseInt(attachmentCount);
                if (!isNaN(attachCount) && attachCount > 0) {
                  note.has_media = true;
                  note.media_count = attachCount;
                }

                resolve(note);
              } else {
                resolve(null);
              }
            } catch (err) {
              resolve(null); // Silently skip failed notes
            }
          })
        );
      }

      // Wait for batch to complete
      const batchResults = await Promise.all(batchPromises);
      const validNotes = batchResults.filter(n => n !== null);
      notes.push(...validNotes);

      console.log(`    ✓ Got ${validNotes.length}/${batchSize} notes from this batch`);
    }

    console.log(`\n✅ Fetched ${notes.length} notes from Apple Notes\n`);

    // Save to raw-notes.json
    const output = {
      notes: notes,
      fetched_at: new Date().toISOString()
    };

    const outputPath = join(__dirname, 'raw-notes.json');
    writeFileSync(outputPath, JSON.stringify(output, null, 2));

    console.log(`💾 Saved to raw-notes.json`);
    console.log(`\n✨ Next step: Run "npm run analyze" to discover connections\n`);

  } catch (error) {
    console.error('❌ Error fetching notes:', error.message);
    console.log('\n💡 Make sure:');
    console.log('   1. You have Apple Notes app installed');
    console.log('   2. You have some notes in the app');
    console.log('   3. Your terminal has necessary permissions\n');
    process.exit(1);
  }
}

fetchNotes().catch(console.error);
