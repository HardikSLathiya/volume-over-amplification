const { GObject, St, Gio } = imports.gi;
const Main = imports.ui.main;
const PopupMenu = imports.ui.popupMenu;
const Volume = imports.ui.status.volume;

let overAmplificationItem;
let volumeMenu;
let originalToggle;
let settings;
let settingsChangedId;

function init() {}

function enable() {
  volumeMenu = Main.panel.statusArea.aggregateMenu._volume._volumeMenu;
  settings = new Gio.Settings({ schema: "org.gnome.desktop.sound" });

  overAmplificationItem = new PopupMenu.PopupSwitchMenuItem(
    "Over Amplification",
    false
  );

  let padding = new St.Widget({ style_class: "popup-menu-item-padding" });
  padding.set_style("width: 8px;");
  overAmplificationItem.insert_child_at_index(padding, 0);

  // Store the original toggle function
  originalToggle = overAmplificationItem.toggle;

  // Override the toggle function
  overAmplificationItem.toggle = function () {
    originalToggle.call(this);
    settings.set_boolean("allow-volume-above-100-percent", this.state);

    // Prevent the menu from closing
    volumeMenu.emit("open-state-changed", true);
  };

  volumeMenu.addMenuItem(overAmplificationItem, 1);

  // Set initial state
  updateToggleState();

  // Listen for changes to the setting
  settingsChangedId = settings.connect(
    "changed::allow-volume-above-100-percent",
    updateToggleState
  );
}

function updateToggleState() {
  let overAmplificationEnabled = settings.get_boolean(
    "allow-volume-above-100-percent"
  );
  overAmplificationItem.setToggleState(overAmplificationEnabled);
}

function disable() {
  if (overAmplificationItem) {
    // Restore the original toggle function
    if (originalToggle) {
      overAmplificationItem.toggle = originalToggle;
    }
    overAmplificationItem.destroy();
    overAmplificationItem = null;
  }

  // Disconnect the settings signal
  if (settingsChangedId) {
    settings.disconnect(settingsChangedId);
    settingsChangedId = null;
  }

  settings = null;
}
