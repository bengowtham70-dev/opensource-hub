---
name: browser-voice-control
description: >
  Build browser-based voice control interfaces using the native Web Speech API
  (SpeechRecognition). Use this skill whenever a user wants to control browser
  tabs, scroll pages, trigger UI actions, or run searches using their voice —
  entirely client-side, no external APIs or keys required. Trigger this skill
  for any request involving: voice commands in the browser, speech-to-action
  workflows, hands-free browsing, accessibility voice control, DOM manipulation
  via microphone input, or "talk to the page" interactions. Even if the user
  just says "add voice control" or "make it voice-activated", use this skill.
  All recognition runs locally via the Web Speech API — no server needed.
compatibility:
  required_browser: Chrome 33+ / Edge 79+ / Safari 14.1+ (Firefox manually enabled)
  api: Web Speech API — SpeechRecognition
  local_processing: Supported via `processLocally`
  network: Optional (depends on browser engine)
---

# Browser Voice Control Skill

Build hands-free, voice-driven browser experiences using the **Web Speech API** — fully
client-side, zero dependencies, zero API keys. Claude generates self-contained HTML/JS
artifacts that listen for voice commands and translate them into DOM actions.

---

## Quick Reference: Core Intent Categories

| User says…                          | Intent category       | Action                            |
|-------------------------------------|-----------------------|-----------------------------------|
| "Open a new tab"                    | `tab_control`         | `window.open()`                   |
| "Close this tab"                    | `tab_control`         | `window.close()`                  |
| "Scroll down / up"                  | `scroll`              | `window.scrollBy()`               |
| "Go to top / bottom"                | `scroll`              | `window.scrollTo()`               |
| "Search for [query]"                | `search`              | focus search input + submit       |
| "Click [button/link name]"          | `dom_click`           | fuzzy-match element + `.click()`  |
| "Fill [field] with [value]"         | `dom_fill`            | target input + `.value =`         |
| "Go back / forward"                 | `navigation`          | `history.back()` / `history.go()` |
| "Refresh the page"                  | `navigation`          | `location.reload()`               |
| "Read the page"                     | `tts`                 | Web Speech `SpeechSynthesis`      |
| "Stop listening"                    | `control`             | `recognition.stop()`              |

---

## Implementation Pattern

Every voice control artifact follows this structure:

```
Every voice control artifact follows this structure:

1. Feature-detect `SpeechRecognition` (using `available()` if possible)
2. Instantiate + configure (set `continuous`, `interimResults`, `processLocally`)
3. Use `phrases` for contextual biasing (improves accuracy)
4. Build a command registry (intent → handler)
5. Parse transcript + execute handler
6. Handle errors with granular user feedback
7. Manage lifecycle (restart logic / state UI)
```

---

## Boilerplate: Minimal Voice Control Artifact

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Robust Voice Control</title>
  <style>
    /* --- status UI --- */
    #vc-badge {
      position: fixed; bottom: 1.5rem; right: 1.5rem;
      padding: 0.75rem 1.25rem; border-radius: 12px;
      font-family: system-ui, sans-serif; font-size: 0.9rem;
      background: #181825; color: #cdd6f4;
      box-shadow: 0 4px 20px #0006; z-index: 9999;
      display: flex; align-items: center; gap: 8px;
      cursor: pointer; user-select: none; transition: all 0.2s;
    }
    #vc-badge:hover { transform: translateY(-2px); background: #1e1e2e; }
    #vc-badge.listening { border: 2px solid #a6e3a1; }
    #vc-status-dot { width: 10px; height: 10px; border-radius: 50%; background: #585b70; }
    #vc-badge.listening #vc-status-dot { background: #a6e3a1; box-shadow: 0 0 8px #a6e3a1; }
    #vc-transcript { font-style: italic; opacity: 0.7; max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  </style>
</head>
<body>

  <div id="vc-badge" title="Click to start/stop">
    <div id="vc-status-dot"></div>
    <span id="vc-status">Click to enable voice</span>
    <span id="vc-transcript"></span>
  </div>

  <script>
  // 1. Feature Detection (Modern + Legacy)
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  
  async function initVoice() {
    if (!SR) {
      updateStatus("⚠️ Not supported", true);
      return;
    }

    // Optional: Check availability for specific language/on-device
    if (SR.available) {
      const status = await SR.available({ lang: 'en-US' });
      if (status.state === 'unavailable') {
        updateStatus("⚠️ Language model missing", true);
      }
    }

    const recognition = new SR();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    // 2. Contextual Biasing (New 'phrases' attribute)
    if ('phrases' in recognition) {
      recognition.phrases = ['scroll down', 'refresh', 'open tab', 'go back'];
    }

    // 3. Command Registry
    const commands = [
      { pattern: /\bscroll\s+down\b/i, handler: () => window.scrollBy({ top: 300, behavior: 'smooth' }) },
      { pattern: /\b(go\s+)?back\b/i, handler: () => history.back() },
      { pattern: /\bstop\s+listening\b/i, handler: () => recognition.stop() }
    ];

    // 4. Event Handlers
    recognition.onstart = () => {
      document.getElementById('vc-badge').classList.add('listening');
      updateStatus("Listening...");
    };

    recognition.onresult = (event) => {
      let interim = '', final = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const t = event.results[i][0].transcript;
        event.results[i].isFinal ? (final += t) : (interim += t);
      }
      document.getElementById('vc-transcript').textContent = ` "${interim || final}"`;
      
      if (final) {
        const t = final.trim().toLowerCase();
        commands.find(c => t.match(c.pattern))?.handler();
      }
    };

    recognition.onerror = (e) => {
      console.error("SR Error:", e.error);
      const errors = {
        'not-allowed': "Mic blocked",
        'no-speech': "No speech detected",
        'network': "Network error",
        'audio-capture': "No mic found"
      };
      updateStatus(`Error: ${errors[e.error] || e.error}`, true);
    };

    recognition.onend = () => {
      document.getElementById('vc-badge').classList.remove('listening');
      updateStatus("Paused");
    };

    // Toggle logic
    let active = false;
    document.getElementById('vc-badge').onclick = () => {
      active ? recognition.stop() : recognition.start();
      active = !active;
    };
  }

  function updateStatus(text, isError = false) {
    const el = document.getElementById('vc-status');
    const badge = document.getElementById('vc-badge');
    el.textContent = text;
    isError ? badge.style.color = '#f38ba8' : badge.style.color = '#cdd6f4';
  }

  initVoice();
  </script>
</body>
</html>
```

---

## Key Configuration Options

```js
recognition.continuous      = true;     // false for single-shot use cases
recognition.interimResults  = true;     // false = only fire on final results
recognition.lang            = 'en-US';  // BCP 47 tag
recognition.processLocally   = true;     // Request on-device recognition (new)
recognition.maxAlternatives  = 1;        // Number of hypotheses
```

### Continuous vs. Single-Shot

| Use case                             | `continuous` |
|--------------------------------------|:------------:|
| Ongoing voice control interface      | `true`       |
| One-time voice search / form fill    | `false`      |
| Push-to-talk (hold button)           | `false`      |

---

## Extending Commands

### DOM Click (fuzzy element matching)

```js
{
  pattern: /\bclick\s+(.+)/i,
  handler: (m) => {
    const label = m[1].trim().toLowerCase();
    const els = [...document.querySelectorAll('button, a, [role=button]')];
    const target = els.find(el => el.textContent.trim().toLowerCase().includes(label));
    target ? target.click() : speak(`Couldn't find "${label}"`);
  }
}
```

### Text-to-Speech Feedback (SpeechSynthesis)

```js
function speak(text, lang = 'en-US') {
  const utt = new SpeechSynthesisUtterance(text);
  utt.lang = lang;
  speechSynthesis.speak(utt);
}
```

### Form Fill

```js
{
  pattern: /\bfill\s+(.+?)\s+with\s+(.+)/i,
  handler: (m) => {
    const fieldName = m[1].trim().toLowerCase();
    const value     = m[2].trim();
    const inputs = [...document.querySelectorAll('input, textarea')];
    const target = inputs.find(el =>
      (el.placeholder || el.name || el.id || el.ariaLabel || '')
        .toLowerCase().includes(fieldName)
    );
    if (target) { target.value = value; target.dispatchEvent(new Event('input')); }
  }
}
```

---

## Permissions & UX Requirements

1. **User gesture required** — `.start()` must be triggered by a user action.
2. **HTTPS required** — Blocked on plain `http://` (except `localhost`).
3. **Status visibility** — Browsers show a red dot/icon; your UI should also show active state.
4. **Safari / Mobile Strictness** — Safari often requires a fresh user gesture to *restart* after `onend`. Avoid aggressive auto-restart loops.

### Recommended Interaction Patterns

| Model | Setup | Best For |
|---|---|---|
| **Single-Shot** | `continuous: false` | Search bars, single commands |
| **Continuous** | `continuous: true` | Hands-free control, dictation |
| **Push-to-Talk** | `mousedown` -> `.start()`, `mouseup` -> `.stop()` | Noisy environments, walkie-talkie UX |

---

## Browser Compatibility

| Browser         | Support          |
|-----------------|-----------------|
| Chrome 33+      | ✅ Full          |
| Edge 79+        | ✅ Full          |
| Safari 14.1+    | ✅ Partial (no `continuous`) |
| Firefox         | ❌ Not supported |
| Mobile Chrome   | ✅               |
| Mobile Safari   | ⚠ Limited       |

**Always include a fallback message** if `SpeechRecognition` is undefined.

---

## Common Errors & Fixes

| `event.error`       | Cause                               | Recommended UI Feedback                  |
|---------------------|-------------------------------------|------------------------------------------|
| `not-allowed`       | Mic permission denied / HTTPS issue | "Microphone access is blocked. Please enable it in browser settings." |
| `no-speech`         | Silence timeout                     | "No speech detected. Please try again."  |
| `network`           | Voice engine call failed            | "Network error. Try again or check connection." |
| `audio-capture`     | No mic found                        | "No microphone detected. Check your hardware." |
| `language-not-supported` | Unsupported `lang` value      | "Selected language is not supported by this browser." |
| `service-not-allowed` | Browser engine restricted/quota   | "Speech service is temporarily unavailable." |

---

## See Also

- `references/speech-recognition-api.md` — Full MDN-style attribute/event reference
- `references/locales.md` — BCP 47 language codes for `recognition.lang`
- [Web Speech API Specification](https://webaudio.github.io/web-speech-api/)

For complex multi-modal apps (voice + canvas / voice + WebRTC), create a `scripts/` directory and split logic into modules.
