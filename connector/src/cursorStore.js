'use strict';
// ─────────────────────────────────────────────────────────────────────────────
//  cursorStore.js - persists per-source "since" cursors to data/cursor.json
//  so pollers resume where they left off after a restart (no event re-scan,
//  no huge catch-up burst after a reboot).
// ─────────────────────────────────────────────────────────────────────────────

const fs = require('fs');
const path = require('path');

class CursorStore {
  constructor(file) {
    this.file = file;
    this.data = {};
    if (file && fs.existsSync(file)) {
      try {
        this.data = JSON.parse(fs.readFileSync(file, 'utf8'));
      } catch (_) {
        this.data = {};
      }
    }
  }

  has(key) {
    return this.data[key] !== undefined;
  }

  get(key) {
    return this.data[key];
  }

  set(key, value) {
    this.data[key] = value;
  }

  persist() {
    if (!this.file) return;
    try {
      fs.mkdirSync(path.dirname(this.file), { recursive: true });
      const tmp = this.file + '.tmp';
      fs.writeFileSync(tmp, JSON.stringify(this.data, null, 2));
      fs.renameSync(tmp, this.file);
    } catch (_) {
      // best effort - losing a cursor only causes a short re-poll window
    }
  }
}

module.exports = { CursorStore };