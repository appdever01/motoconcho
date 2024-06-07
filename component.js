const { needed } = require("./func");

const languageButtons = [
  { id: "btn_eng", title: "🇬🇧 English" },
  { id: "btn_spa", title: "🇪🇸 Spanish" },
];
const dest_confirm = [
  { id: "check_driver", title: needed.language == "english" ? "Continue" : "continuar", },
  { id: "cancel_trip", title: needed.language == "english" ? "Cancel trip" : "cancelar", },
];

const adminBtn = [
  { id: "manage_driver", title: "Manage Drivers  👨‍✈️ " },
  { id: "manage_users", title: "Manage Users 👤 " },
  { id: "manage_trips", title: "View All Trips 🌍" },
];
module.exports = { languageButtons, dest_confirm, adminBtn };
