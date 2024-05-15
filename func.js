const languageMessages = require("./lang");

let needed = {
  name: false,
  email: false,
  location: false,
  destination: false,
  welcome: false,
  isUser: false,
  language: "english",
  driver: {
    name: false,
    email: false,
    address: false,
    language: false,
    vehicleName: false,
    vehiclePic: false,
    plateNo: false,
  },
};

function validateName(data) {
  const trimmedName = data.msg.trim();

  if (data.type == "text" && trimmedName.length < 3) {
    return "Oops! Your name should have at least 3 letters. 😊";
  } else if (data.type == "text" && !trimmedName.includes(" ")) {
    return "Could you please provide your full name, including both your first and last name? 😊";
  } else if (data.type !== "text" || typeof trimmedName !== "string") {
    return "Please provide your legal and valid full name 😊";
  } else {
    return true;
  }
}

function validateMail(data) {
  const trimmedEmail = data.msg.trim();

  if (data.type == "text" && !trimmedEmail.includes("@")) {
    return "Please ensure your email contains an '@' symbol. 📧";
  } else if (data.type == "text" && !trimmedEmail.includes(".")) {
    return "Please provide a valid email address, including a domain. For example: test@gmail.com 🌐";
  } else if (data.type !== "text" || typeof trimmedEmail !== "string") {
    return "Please provide a valid email address 📧";
  } else {
    return true;
  }
}

function validateAddress(data) {
  const trimmedAddress = data.msg.trim();

  if (data.type == "text" && trimmedAddress.length < 5) {
    return "Please provide a valid address with at least 5 characters. 🏠";
  } else if (data.type !== "text" || typeof trimmedAddress !== "string") {
    return "Please provide a valid address. 🏠";
  } else if (!trimmedAddress.includes(" ")) {
    return "Could you please provide your full address, including both your street and city? 🏠";
  } else {
    return true;
  }
}

function validateVehicleName(data) {
  const trimmedVehicleName = data.msg.trim();

  if (data.type == "text" && trimmedVehicleName.length < 3) {
    return "Please provide a valid vehicle name with at least 3 characters. 🚗";
  } else if (data.type !== "text" || typeof trimmedVehicleName !== "string") {
    return "Please provide a valid vehicle name. 🚗";
  } else {
    return true;
  }
}

function validatePlate(data) {
  const trimmedPlateNumber = data.msg.trim();

  if (data.type == "text" && trimmedPlateNumber.length < 3) {
    return "Please provide a valid vehicle plate number with at least 3 characters. 🪪 ";
  } else if (data.type !== "text" || typeof trimmedPlateNumber !== "string") {
    return "Please provide a valid vehicle plate number. 🪪";
  } else {
    return true;
  }
}

function validatePhone(data) {
  const trimmedPhone = data.msg.trim();

  if (data.type == "text" && trimmedPhone.length < 10) {
    return "Please provide a valid phone number with at least 10 digits. 📞";
  } else if (data.type !== "text" || typeof trimmedPhone !== "string") {
    return "Please provide a valid phone number. 📞";
  } else if (!trimmedPhone.match(/^\+\d{10,14}$/)) {
    return "Please provide a valid phone number starting with a country code and containing only numbers. 📞";
  } else {
    return true;
  }
}

function validatePic(data) {
  const img_id = data.img_id;

  if (data.type !== "image") {
    return "Please provide a valid picture of the vehicle 🚗";
  } else {
    return true;
  }
}

function validateLanguage(data) {
  const supportedLanguages = ["english", "spanish", "french"];
  const msg = data.msg.trim();
  if (data.type == "text" && !supportedLanguages.includes(msg.toLowerCase())) {
    return "Please select a supported language: English, Spanish, or French. 🌍";
  } else if (data.type !== "text" || typeof msg !== "string") {
    return "Please provide a valid address. 🏠";
  } else {
    return true;
  }
}

function validateLocation(data) {
  const osunBoundaries = {
    minLat: 7.4629,
    maxLat: 8.6629,
    minLong: 4.42,
    maxLong: 4.62,
  };

  if (
    data.lat >= osunBoundaries.minLat &&
    data.lat <= osunBoundaries.maxLat &&
    data.long >= osunBoundaries.minLong &&
    data.long <= osunBoundaries.maxLong
  ) {
    return true;
  } else if (data.type !== "location") {
    return "The location you sent is invalid ❎, kind follow the steps in the screenshot below to share your location. 📍🌍";
  } else {
    console.log(`Longitude : ${data.long}`);
    console.log(`Latitude : ${data.lat}`);
    return "Sorry, your location is not within Sosua, Dominican Republic. Only people within that city are allowed. 🌍";
  }
}

function getLanguageMessage(messageId, language) {
  return languageMessages[messageId][language];
}
// Helper function to create a delay
function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

module.exports = {
  needed,
  validateName,
  validateMail,
  validateLocation,
  validateAddress,
  validatePhone,
  validateLanguage,
  validatePic,
  validatePlate,
  validateVehicleName,
  getLanguageMessage,
  delay,
};
