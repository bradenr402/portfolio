export default function initKeyPressListeners() {
  const kbdElements = Array.from(document.querySelectorAll("kbd"));

  const normalize = (v) => v.trim().toLowerCase();

  // Map display text → modifier flag OR special/meta identifier
  const modifierMap = {
    "⌘": "metaKey",
    "cmd": "metaKey",
    "command": "metaKey",

    "⌥": "altKey",
    "alt": "altKey",
    "option": "altKey",

    "⌃": "ctrlKey",
    "ctrl": "ctrlKey",
    "control": "ctrlKey",

    "⇧": "shiftKey",
    "shift": "shiftKey",
  };

  // Non‑modifier special keys where event.key is a name, not a character
  const specialKeyMap = {
    "⎋": "escape",
    "esc": "escape",
    "escape": "escape",

    "⇥": "tab",
    "tab": "tab",

    "␣": " ",
    "space": " ",

    "⏎": "enter",
    "enter": "enter",
    "return": "enter",

    "backspace": "backspace",
    "⌫": "delete",
    "delete": "delete",

    "↑": "arrowup",
    "arrowup": "arrowup",
    "↓": "arrowdown",
    "arrowdown": "arrowdown",
    "←": "arrowleft",
    "arrowleft": "arrowleft",
    "→": "arrowright",
    "arrowright": "arrowright",
  };

  const updateModifiers = (event) => {
    kbdElements.forEach((kbd) => {
      const text = normalize(kbd.textContent);

      // Modifiers, e.g. <kbd>⌘</kbd>, <kbd>⌥</kbd>, <kbd>⌃</kbd>, <kbd>⇧</kbd>
      const modifierFlag = modifierMap[text];
      if (modifierFlag) {
        kbd.classList.toggle("is-active", !!event[modifierFlag]);
        return;
      }
    });
  };

  const updateRegularKeys = (event, isActive) => {
    const eventKeyNorm = normalize(event.key);

    kbdElements.forEach((kbd) => {
      const rawText = kbd.textContent;
      const text = normalize(rawText);

      // Skip things handled as modifiers
      if (modifierMap[text]) return;

      // 1) Named special keys (Esc, Enter, Arrow keys, etc.), e.g. <kbd>esc</kbd>
      const special = specialKeyMap[text];
      if (special && special === eventKeyNorm) {
        kbd.classList.toggle("is-active", isActive);
        return;
      }

      // 2) Single character keys – compare by character, not name, e.g. <kbd>a</kbd> or <kbd>A</kbd>
      if (rawText.length === 1) {
        const charNorm = normalize(rawText);
        if (eventKeyNorm === charNorm) {
          kbd.classList.toggle("is-active", isActive);
        }
        return;
      }

      // 3) Fallback: direct `key` name match, e.g. <kbd>enter</kbd>
      if (eventKeyNorm === text) {
        kbd.classList.toggle("is-active", isActive);
      }
    });
  };

  window.addEventListener("keydown", (e) => {
    updateModifiers(e);
    updateRegularKeys(e, true);
  });

  window.addEventListener("keyup", (e) => {
    updateModifiers(e);
    updateRegularKeys(e, false);
  });
}
