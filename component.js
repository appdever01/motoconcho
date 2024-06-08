const { needed } = require("./func");

const languageButtons = (language) => {
  return [
    {
      id: "btn_eng",
      title: language == "english" ? "🇬🇧 English" : "🇪🇸 Spanish",
    },
  ];
};

const dest_confirm = (language) => {
  return [
    {
      id: "check_driver",
      title: language == "english" ? "Continue" : "continuar",
    },
    {
      id: "cancel_trip",
      title: language == "english" ? "Cancel trip" : "cancelar",
    },
  ];
};

const adminBtn = (language) => {
  return [
    {
      id: "manage_driver",
      title: language == "english" ? "Manage Drivers  👨‍✈️ " : "Administrar  👨‍✈️",
    },
    {
      id: "manage_users",
      title: language == "english" ? "Manage Users 👤 " : "Administrar 👤",
    },
    {
      id: "manage_trips",
      title: language == "english" ? "View All Trips 🌍" : " Ver Todos 🌍",
    },
  ];
};
module.exports = { languageButtons, dest_confirm, adminBtn };
