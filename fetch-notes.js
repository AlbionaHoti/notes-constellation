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

    console.log(`📊 Found ${totalNotes} total notes, fetching all...\n`);

    const notes = [];
    const limit = totalNotes; // Get ALL notes

    for (let i = 1; i <= limit; i++) {
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
          maxBuffer: 1024 * 1024,
          timeout: 5000
        }).trim();

        const parts = result.split('|||DIVIDER|||');
        const [content, dateStr, attachmentCount] = parts;

        if (!content || content.trim().length === 0) {
          continue;
        }

        // Extract URLs before cleaning HTML
        const urlRegex = /(https?:\/\/[^\s<>"]+)/g;
        const urls = content.match(urlRegex) || [];

        // Clean HTML but preserve structure
        const cleanContent = content
          .substring(0, 10000) // Limit to prevent buffer overflow
          .replace(/<br>/g, '\n')  // Convert <br> to newlines
          .replace(/<[^>]*>/g, ' ')  // Replace other HTML tags with space
          .replace(/&amp;/g, '&')
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/&quot;/g, '"')
          .replace(/\s+/g, ' ')  // Collapse multiple spaces
          .replace(/\n\s+/g, '\n')  // Clean up newlines
          .trim();

        if (cleanContent.length >= 10) {
          // Parse date more robustly
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

          // Add metadata if present
          if (urls.length > 0) {
            note.urls = urls.slice(0, 5); // Max 5 URLs
          }

          const attachCount = parseInt(attachmentCount);
          if (!isNaN(attachCount) && attachCount > 0) {
            note.has_media = true;
            note.media_count = attachCount;
          }

          notes.push(note);

          if (notes.length % 10 === 0) {
            console.log(`  Processed ${notes.length} notes...`);
          }
        }
      } catch (err) {
        // Skip notes that fail but log first few errors
        if (notes.length < 3) {
          console.error(`  ⚠️  Note ${i} failed:`, err.message.substring(0, 100));
        }
        continue;
      }
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
