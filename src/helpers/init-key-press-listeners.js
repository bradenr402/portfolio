export default function initKeyPressListeners() {
  const kbdElements = Array.from(document.querySelectorAll("kbd"));

  const normalize = (v) => v.trim().toLowerCase();

  const modifierMap = {
    "⌘": "metaKey",
    "cmd": "metaKey",
    "command": "metaKey",
    "⇧": "shiftKey",
    "shift": "shiftKey",
    "ctrl": "ctrlKey",
    "control": "ctrlKey",
    "alt": "altKey",
    "option": "altKey",
  };

  const updateModifiers = (event) => {
    kbdElements.forEach((kbd) => {
      const text = normalize(kbd.textContent);
      const modifier = modifierMap[text];

      if (modifier) {
        kbd.classList.toggle("is-active", event[modifier]);
      }
    });
  };

  const updateRegularKeys = (event, isActive) => {
    kbdElements.forEach((kbd) => {
      const text = normalize(kbd.textContent);

      if (!modifierMap[text] && normalize(event.key) === text) {
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
