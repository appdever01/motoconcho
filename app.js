require("dotenv").config();
const express = require("express");
const {
  send_button,
  send_message,
  send_template,
  send_image,
  trip_alert,
  send_contact,
  send_driver_template,
  caddress,
} = require("./wa_func");
const mongoose = require("mongoose");
const app = express();
const { User, Trip, Driver } = require("./db_model/user_model");
const { languageButtons, dest_confirm, adminBtn } = require("./component");
const {
  validateName,
  validateMail,
  validateAddress,
  validateLanguage,
  validateVehicleName,
  validatePic,
  validatePhone,
  validatePlate,
  validateLocation,
  validateTicket,
  getLanguageMessage,
  delay,
} = require("./func");

const adminNumber = ["2347049972537", "18096657332"];

app.use(express.json());

const connectionString = process.env.MONGO_URI;
mongoose
  .connect(connectionString)
  .then(() => console.log("MongoDB connected"))
  .catch((error) => console.log(error.message));

const getDriverCount = async () => {
  try {
    const count = await Driver.countDocuments({});
    console.log("Number of documents in 'drivers' collection:", count);
    return count;
  } catch (error) {
    console.error("Error counting documents:", error);
    return null;
  }
};
const getUserCount = async () => {
  try {
    const count = await User.countDocuments({});
    console.log("Number of documents in 'users' collection:", count);
    return count;
  } catch (error) {
    console.error("Error counting documents:", error);
    return null;
  }
};

const userMap = new Map();
const tripMap = new Map();
const needsMap = new Map();
let needTicket = false;
let wTicket = "";

const newDriver = new Driver({
  fullname: "",
  phone: "",
  language: "",
  address: "",
  ticket: 2,
  vehicleName: "",
  vehiclePic: "",
  plateNumber: "",
});

let tem = true;
app.post("/webhook", async (req, res) => {
  let newUser = User({});
  let newTrip = Trip({});
  let needed = {};
  let usr = User({});
  const data = req.body;
  const isAdmin = adminNumber.includes(data.to);

  // working with user map-------------
  // working with user map-------------
  // working with user map-------------

  if (userMap.has(data.to)) {
    newUser = userMap.get(data.to);
  } else {
    let newUser = new User({
      fullname: "",
      language: "english",
      language: ["", ""],
      phone: data.to,
    });
    userMap.set(data.to, newUser);
  }

  // working with trip map-------------
  // working with trip map-------------
  // working with trip map-------------

  if (tripMap.has(data.to)) {
    newTrip = tripMap.get(data.to);
  } else {
    let newTrip = new Trip({
      location: [],
      destination: [],
      name: "",
      address: "",
      gotDriver: false,
      driverId: "",
      phone: "",
      driverPhone: "",
    });
    userMap.set(data.to, newTrip);
  }

  // working with needs map-------------
  // working with needs map-------------
  // working with needs map-------------

  if (needsMap.has(data.to)) {
    needed = needsMap.get(data.to);
  } else {
    needed = {
      name: false,
      email: false,
      location: false,
      destination: false,
      welcome: true,
      isUser: false,
      address: false,
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
    userMap.set(data.to, needed);
  }
  try {
    const user = await User.findOne({ phone: data.to });
    const bannedUser = await User.findOne({ phone: data.to, banned: true });
    if (user && bannedUser == null) {
      needed.language = user.language;
      // console.log("User found:", user);
      usr = user;
      newUser = user;

      needed.language = usr.language;
      needsMap.set(data.to, needed);

      if (tem && !data.msg.startsWith("/")) {
        if (isAdmin) {
          send_button(
            needed.language == "english"
              ? "Hello *MOTOCONCHO* Admin! 🚀🌍 ! You can now manage trips, users and drivers within the beautiful city of Sosua, Dominican Republic. 🚗🌴🌞"
              : "¡Hola *Administrador de MOTOCONCHO*! 🚀🌍 ¡Ahora puedes gestionar viajes, usuarios y conductores dentro de la hermosa ciudad de Sosua, República Dominicana. 🚗🌴🌞",
            [
              {
                id: "create_trip",
                title: needed.language
                  ? "Start a trip 🚕"
                  : "Comenzar un viaje 🚕",
              },
              {
                id: "admin_menu",
                title:
                  needed.language == "english"
                    ? "Admin menu 📋"
                    : "Admin menu 📋",
              },
            ],

            data
          );
        } else {
          send_button(
            needed.language == "english"
              ? `Hello *${newUser.fullname}*! 🚀🌍 \n\nWelcome back to MOTOCONCHO. Your account is registered with the email ${newUser.email}. 📧👍 Feel free to start or manage your trips and explore driver options within the beautiful city of Sosua, Dominican Republic. 🚗🌴🌞`
              : `¡Hola *${newUser.fullname}*! 🚀🌍 \n\nBienvenido de nuevo a MOTOCONCHO. Tu cuenta está registrada con el correo electrónico ${newUser.email}. 📧👍 Siéntete libre de comenzar o gestionar tus viajes y explorar opciones de conductores dentro de la hermosa ciudad de Sosua, República Dominicana. 🚗🌴🌞`,
            [
              {
                id: "create_trip",
                title: needed.language
                  ? "Start a trip 🚕"
                  : "Comenzar un viaje 🚕",
              },
            ],

            data
          );
        }
        tem = false;
      }
    } else if (bannedUser !== null) {
      send_message(getLanguageMessage("banMessage", needed.language), data);
    } else {
      newUser.phone = data.to;
      userMap.set(data.to, newUser);
      if (
        needed.welcome &&
        !data.msg.startsWith("/") &&
        data.type !== "button"
      ) {
        send_button(
          getLanguageMessage("chooseLanguage", needed.language),
          languageButtons,
          data
        );
        await delay(3500);
        send_button(
          getLanguageMessage("welcome_message", needed.language),
          [{ id: "learn_more", title: "Learn more 🚖" }],
          data
        );

        needed.welcome = false;
        needsMap.set(data.to, needed);
      }

      if (needed.name) {
        if (validateName(data) == true) {
          newUser.fullname = data.msg.replace(
            /\b\w+/g,
            (word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
          );

          needed.name = false;

          await delay(1500);
          needed.location = true;
          userMap.set(data.to, newUser);
          needsMap.set(data.to, needed);
          send_template(
            "send_image",
            "https://i.ibb.co/fqpf87k/IMG-20240506-210512.jpg",
            needed.language == "english" ? "en_US" : "es",
            data
          );
        } else {
          needed.name = true;
          needsMap.set(data.to, needed);
          send_message(validateName(data), data);
        }
      }

      if (needed.location && data.type == "location") {
        if (validateLocation(data) == true) {
          newTrip.location = [data.lat, data.long];
          needed.location = false;
          const cad = await caddress(data);
          send_button(
            needed.language == "english"
              ? `Your current location has been received 📍🌍. You're almost set! You are currently in ${cad.city}, ${cad.country}.`
              : `Tu ubicación actual ha sido recibida 📍🌍. ¡Casi listo! Actualmente te encuentras en ${cad.city}, ${cad.country}.`,
            [
              {
                id: "change_location",
                title:
                  needed.language == "english"
                    ? "Change location 🌍"
                    : "Cambiar ubicación 🌍",
              },
            ],
            data
          );
          await delay(3000);
          needed.location = false;
          tripMap.set(data.to, newTrip);
          needsMap.set(data.to, needed);

          if (isAdmin) {
            send_button(
              needed.language == "english"
                ? "Hello *MOTOCONCHO* Admin! 🚀🌍 ! You can now manage trips, users and drivers within the beautiful city of Sosua, Dominican Republic. 🚗🌴🌞"
                : "¡Hola *Administrador de MOTOCONCHO*! 🚀🌍 ¡Ahora puedes gestionar viajes, usuarios y conductores dentro de la hermosa ciudad de Sosua, República Dominicana. 🚗🌴🌞",
              [
                {
                  id: "create_trip",
                  title:
                    needed.language == "english"
                      ? "Start a trip 🚕"
                      : "Comenzar un viaje 🚕",
                },
                {
                  id: "admin_menu",
                  title: "Admin menu 📋",
                },
              ],

              data
            );
          } else {
            send_button(
              needed.language == "english"
                ? `Hello *${newUser.fullname}*! 🚀🌍 \n\nWelcome back to MOTOCONCHO. Your account is registered with the email ${newUser.email}. 📧👍 Feel free to start or manage your trips and explore driver options within the beautiful city of Sosua, Dominican Republic. 🚗🌴🌞`
                : `¡Hola *${newUser.fullname}*! 🚀🌍 \n\nBienvenido de nuevo a MOTOCONCHO. Tu cuenta está registrada con el correo electrónico ${newUser.email}. 📧👍 Siéntete libre de comenzar o gestionar tus viajes y explorar opciones de conductores dentro de la hermosa ciudad de Sosua, República Dominicana. 🚗🌴🌞`,
              [
                {
                  id: "create_trip",
                  title:
                    needed.language == "english"
                      ? "Start a trip 🚕"
                      : "Comenzar un viaje 🚕",
                },
              ],

              data
            );
          }
          tem = false;

          newUser
            .save()
            .then((savedUser) => {
              console.log("User saved successfully:", savedUser);
            })
            .catch((error) => {
              console.error("Error saving user:", error);
            });
        } else {
          needed.location = true;
          send_message(validateLocation(data), data);
        }
      }
    }

    // Getting destination ---------------------------------------------------------
    // Getting destination ---------------------------------------------------------
    // Getting destination ---------------------------------------------------------

    if (needed.address) {
      if (validateAddress(data) == true) {
        newTrip.address = data.msg.trim();

        send_template(
          "get_dest",
          "https://i.ibb.co/ng2664M/IMG-20240506-210439.jpg",
          needed.language == "english" ? "en_US" : "es",
          data
        );
        needed.address = false;
        needed.destination = true;
        tripMap.set(data.to, newTrip);
        needsMap.set(data.to, needed);
      } else {
        needed.address = true;
        needsMap.set(data.to, needed);
        send_message(validateAddress(data), data);
      }
    }

    if (needed.destination && data.type == "location") {
      console.log(data);
      if (validateLocation(data) == true) {
        newTrip.destination = [data.lat, data.long];

        needed.destination = false;
        const cad = await caddress(data);
        const msg =
          needed.language == "english"
            ? `📍 Your destination coordinates have been successfully saved to ${
                data.name !== "" && data.address !== ""
                  ? `${data.name}, ${data.address}`
                  : newTrip.address
              }\n\nYou're all set to embark on your exciting journey! 🚀🗺 Get ready to explore new horizons! 🌅🌍`
            : `📍 Tus coordenadas de destino se han guardado exitosamente en ${
                data.name !== "" && data.address !== ""
                  ? `${data.name}, ${data.address}`
                  : newTrip.address
              }\n\n¡Estás listo para embarcarte en tu emocionante viaje! 🚀🗺 ¡Prepárate para explorar nuevos horizontes! 🌅🌍`;
        newTrip.name = data.name !== "" ? data.name : cad.city;
        newTrip.address = data.address !== "" ? data.name : cad.address;
        tripMap.set(data.to, newTrip);
        needsMap.set(data.to, needed);

        console.log(msg);
        send_button(msg, dest_confirm, data);
      } else {
        needed.destination = true;
        needsMap.set(data.to, needed);
        send_message(validateLocation(data), data);
      }
    }

    // Collecting drivers detail ---------------------------------------------------------
    // Collecting drivers detail ---------------------------------------------------------
    // Collecting drivers detail ---------------------------------------------------------

    if (needed.driver.name) {
      if (validateName(data) == true) {
        newDriver.fullname = data.msg.replace(
          /\b\w+/g,
          (word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
        );
        needed.driver.name = false;
        needed.driver.phone = true;
        needsMap.set(data.to, needed);
        send_message(getLanguageMessage("providePhone", needed.language), data);
        await delay(1500);
      } else {
        needed.driver.name = true;
        needsMap.set(data.to, needed);
        send_message(validateName(data), data);
      }
    }

    if (
      needed.driver.phone &&
      data.msg.replace(
        /\b\w+/g,
        (word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
      ) !== newDriver.fullname
    ) {
      if (validatePhone(data) == true) {
        newDriver.phone = data.msg;
        needed.driver.phone = false;
        needed.driver.address = true;
        needsMap.set(data.to, needed);
        send_message(
          getLanguageMessage("provideAddress", needed.language),
          data
        );
        console.log("iffing");
      } else {
        needed.driver.phone = true;
        needsMap.set(data.to, needed);
        send_message(validatePhone(data), data);
        console.log(data.msg);
      }
    }
    if (needed.driver.address && data.msg !== newDriver.phone) {
      if (validateAddress(data) == true) {
        newDriver.address = data.msg;
        needed.driver.address = false;
        needed.driver.language = true;
        needsMap.set(data.to, needed);
        send_message(getLanguageMessage("whatLanguage", needed.language), data);
      } else {
        needed.driver.address = true;
        needsMap.set(data.to, needed);
        send_message(validateAddress(data), data);
      }
    }
    if (needed.driver.language && data.msg !== newDriver.address) {
      if (validateLanguage(data) == true) {
        newDriver.language = data.msg;
        needed.driver.language = false;
        needed.driver.vehicleName = true;
        needsMap.set(data.to, needed);
        send_message(getLanguageMessage("vehicleName", needed.language), data);
      } else {
        needed.driver.language = true;
        send_message(validateLanguage(data), data);
      }
    }
    if (needed.driver.vehicleName && data.msg !== newDriver.language) {
      if (validateVehicleName(data) == true) {
        newDriver.vehicleName = data.msg;
        needed.driver.vehicleName = false;
        needed.driver.vehiclePic = true;
        needsMap.set(data.to, needed);
        send_message(
          needed.language == "english"
            ? `Please provide the picture of the *${newDriver.vehicleName}* vehicle the driver is using 🚙`
            : `Por favor proporciona la imagen del vehículo *${newDriver.vehicleName}* que está usando el conductor 🚙`,
          data
        );
      } else {
        needed.driver.vehicleName = true;
        needsMap.set(data.to, needed);
        send_message(validateVehicleName(data), data);
      }
    }
    if (needed.driver.vehicleName && data.msg !== newDriver.language) {
      if (validateVehicleName(data) == true) {
        newDriver.vehicleName = data.msg;
        needed.driver.vehicleName = false;
        needed.driver.vehiclePic = true;
        needsMap.set(data.to, needed);
        send_message(
          needed.language == "english"
            ? `Please provide the picture of the *${newDriver.vehicleName}* vehicle the driver is using 🚕`
            : `Por favor proporciona la imagen del vehículo *${newDriver.vehicleName}* que está usando el conductor 🚕`,
          data
        );
      } else {
        needed.driver.vehicleName = true;
        needsMap.set(data.to, needed);
        send_message(validateVehicleName(data), data);
      }
    }
    if (needed.driver.vehiclePic && data.msg !== newDriver.vehicleName) {
      if (validatePic(data) == true) {
        newDriver.vehiclePic = data.img_id;
        needed.driver.vehiclePic = false;

        send_message(
          needed.language == "english"
            ? `Please provide the plate number of the *${newDriver.vehicleName}* vehicle the driver is using 🪪`
            : `Por favor proporciona el número de placa del vehículo *${newDriver.vehicleName}* que está usando el conductor 🪪`,
          data
        );
        needed.driver.plateNumber = true;
      } else {
        needed.driver.vehiclePic = true;
        send_message(validatePic(data), data);
      }
    }
    if (needed.driver.plateNumber && data.type !== "image") {
      if (validatePlate(data) == true) {
        newDriver.plateNumber = data.msg;
        console.log(newDriver.plateNumber);
        needed.driver.plateNumber = false;
        needsMap.set(data.to, needed);

        newDriver
          .save()
          .then((savedDriver) => {
            console.log("Driver added successfully:", savedDriver);
            send_message(
              needed.language == "english"
                ? "*Please wait a moment* ⏳"
                : "*Por favor espera un momento* ⏳",
              data
            );
            send_driver_template(null, data, newDriver);
          })
          .catch((error) => {
            console.error("Error saving user:", error);
          });
      } else {
        needed.driver.plateNumber = true;
        needsMap.set(data.to, needed);
        send_message(validatePlate(data), data);
      }
    }

    // Working with Interactive  ---------------------------------------------------------
    // Working with Interactive  ---------------------------------------------------------
    // Working with Interactive  ---------------------------------------------------------

    if (data.msg == "/change_language") {
      send_button(
        "Hey there! 👋 Could you please choose your language? 🌐",
        languageButtons,
        data
      );
    } else if (data.msg == "/learn_more") {
      send_template(
        "learn_more",
        "https://i.ibb.co/TL6pV5v/315-C110-D-6255-4-A54-96-C7-761-F6-AF16-D5-A-1.png",
        needed.language == "english" ? "en_US" : "es",
        data
      );
    } else if (data.msg == "/menu") {
      needed.location = false;
      needed.destination = false;
      needsMap.set(data.to, needed);
      if (isAdmin) {
        send_button(
          needed.language == "english"
            ? "Hello *MOTOCONCHO* Admin! 🚀🌍 ! You can now manage trips, users and drivers within the beautiful city of Sosua, Dominican Republic. 🚗🌴🌞"
            : "¡Hola *Administrador de MOTOCONCHO*! 🚀🌍 ¡Ahora puedes gestionar viajes, usuarios y conductores dentro de la hermosa ciudad de Sosua, República Dominicana. 🚗🌴🌞",
          [
            {
              id: "create_trip",
              title:
                needed.language == "english"
                  ? "Start a trip 🚕"
                  : "Comenzar un viaje 🚕",
            },
            {
              id: "admin_menu",
              title: needed.language ? "Admin menu 📋" : "Admin menu 📋",
            },
          ],

          data
        );
      } else {
        const user = await User.findOne({ phone: data.to });
        const bannedUser = await User.findOne({ phone: data.to, banned: true });
        if (!user) {
          needed.welcome = true;
          needsMap.set(data.to, needed);
        } else {
          send_button(
            needed.language == "english"
              ? `Hello *${newUser.fullname}*! 🚀🌍 \n\nWelcome back to MOTOCONCHO. Your account is registered with the email ${newUser.email}. 📧👍 Feel free to start or manage your trips and explore driver options within the beautiful city of Sosua, Dominican Republic. 🚗🌴🌞`
              : `¡Hola *${newUser.fullname}*! 🚀🌍 \n\nBienvenido de nuevo a MOTOCONCHO. Tu cuenta está registrada con el correo electrónico ${newUser.email}. 📧👍 Siéntete libre de comenzar o gestionar tus viajes y explorar opciones de conductores dentro de la hermosa ciudad de Sosua, República Dominicana. 🚗🌴🌞`,
            [
              {
                id: "create_trip",
                title:
                  needed.language == "english"
                    ? "Start a trip 🚕"
                    : "Comenzar un viaje 🚕",
              },
            ],

            data
          );
        }
      }
      tem = false;
    }
    if (data.type === "interactive") {
      switch (data.btn_id) {
        case "learn_more":
          send_template(
            "learn_more",
            "https://i.ibb.co/TL6pV5v/315-C110-D-6255-4-A54-96-C7-761-F6-AF16-D5-A-1.png",
            needed.language == "english" ? "en_US" : "es",
            data
          );
          break;
        case "btn_eng":
          newUser.language = "english";
          needed.language = "english";
          send_message("Your language has been set to English 🇬🇧", data);
          await delay(3000);
          send_message(
            needed.language == "english"
              ? "Could you kindly tell me your name? 😊👤"
              : "¿Podrías decirme amablemente tu nombre? 😊👤",
            data
          );
          needed.name = true;
          tripMap.set(data.to, newTrip);
          needsMap.set(data.to, needed);

          break;
        case "btn_spa":
          newUser.language = "spanish";
          needed.language = "spanish";
          needsMap.set(data.to, needed);
          send_message("Tu idioma se ha establecido en español 🇪🇸", data);
          await delay(3000);
          send_message(
            needed.language == "english"
              ? "Could you kindly tell me your name? 😊👤"
              : "¿Podrías decirme amablemente tu nombre? 😊👤",
            data
          );
          needed.name = true;
          tripMap.set(data.to, newTrip);
          needsMap.set(data.to, needed);
          break;
        case "change_location":
          needed.location = true;
          needed.destination = false;
          needsMap.set(data.to, needed);
          send_template(
            "send_image",
            "https://i.ibb.co/fqpf87k/IMG-20240506-210512.jpg",
            needed.language == "english" ? "en_US" : "es",
            data
          );

          break;
        case "change_destination":
          needed.location = false;
          needed.address = true;
          needsMap.set(data.to, needed);
          send_message(
            needed.language == "english"
              ? "Please provide the address of where you are going to ! "
              : "¡Por favor proporciona la dirección a la que te diriges! ",
            data
          );

          break;
        case "create_trip":
          send_message(
            needed.language == "english"
              ? "Please provide the address of where you are going to ! "
              : "¡Por favor proporciona la dirección a la que te diriges! ",
            data
          );
          needed.address = true;
          needsMap.set(data.to, needed);
          break;

        case "check_driver":
          newTrip.phone = data.to;
          tripMap.set(data.to, newTrip);
          newTrip.save().then(async (savedTrip) => {
            console.log("Trip Saved");
            send_message(
              needed.language == "english"
                ? "Your trip information has been sent to all our available drivers. Please wait for one of them to accept the trip. Feel free to alert any driver you like! 🚗📣 Once they accept your trip, I'll notify you right away! 📩"
                : "Tu información de viaje ha sido enviada a todos nuestros conductores disponibles. Por favor, espera a que uno de ellos acepte el viaje. ¡Siéntete libre de alertar a cualquier conductor que desees! 🚗📣 Una vez que acepten tu viaje, ¡te notificaré de inmediato! 📩",
              data
            );
            Driver.find({})
              .then(async (drivers) => {
                if (drivers.length === 0) {
                  send_message(
                    needed.language == "english"
                      ? "No drivers found at the moment. Please try again later."
                      : "No se encontraron conductores en este momento. Por favor, inténtalo de nuevo más tarde.",
                    data
                  );
                } else {
                  for (const driver of drivers) {
                    trip_alert(
                      driver.language == "English" ? "en_US" : "es",
                      driver.phone,
                      newUser,
                      newTrip
                    );
                    await delay(3000);
                  }
                }
              })
              .catch((err) => {
                console.error("Error fetching drivers:", err);
              });
          });

          break;
        case "cancel_trip":
          needed.location = false;
          needed.destination = false;
          needsMap.set(data.to, needed);
          Trip.deleteOne({ phone: `+${data.to}` }).then((result) => {
            send_button(
              needed.language == "english"
                ? "Your trip has been successfully cancelled ✅"
                : "Tu viaje ha sido cancelado exitosamente ✅",
              [{ id: "create_trip", title: "Start a new trip 🚕" }],
              data
            );
          });

          break;
        case "admin_menu":
          send_button(
            needed.language == "english"
              ? "Hello there! Welcome to the *MOTOCONCHO* Admin Menu 📋!"
              : "¡Hola! ¡Bienvenido al Menú de Administrador de *MOTOCONCHO* 📋!",
            adminBtn,
            data
          );
          break;
        case "manage_driver":
          const driverCount = await getDriverCount();
          send_button(
            needed.language == "english"
              ? `👨‍✈️ Hello there! Welcome to the *MOTOCONCHO* Driver Management Menu 📋! \n\nCurrently, we have *${driverCount}* registered drivers. 🚗`
              : `👨‍✈️ ¡Hola! ¡Bienvenido al Menú de Administración de Conductores de *MOTOCONCHO* 📋! \n\nActualmente, tenemos *${driverCount}* conductores registrados. 🚗`,
            [
              { id: "add_driver", title: "Add New Driver 👨‍✈️" },
              { id: "view_drivers", title: "View All Drivers 👥 " },
            ],
            data
          );
          break;

        case "add_driver":
          send_message(
            needed.language == "english"
              ? "👋 Hey there! What's the name of the driver you are adding? "
              : "👋 ¡Hola! ¿Cuál es el nombre del conductor que estás agregando? ",
            data
          );
          needed.driver.name = true;
          needsMap.set(data.to, needed);

          break;
        case "view_drivers":
          send_message(
            needed.language == "english"
              ? "*Please wait while fetching all drivers* ⏳👨‍✈️"
              : "*Por favor espera mientras se obtienen todos los conductores* ⏳👨‍✈️",
            data
          );
          needed.driver.name = false;
          needed.driver.phone = false;
          needed.driver.address = false;
          needsMap.set(data.to, needed);
          Driver.find({})
            .then(async (drivers) => {
              if (drivers.length === 0) {
                send_message(
                  needed.language == "english"
                    ? "No drivers found at the moment. Please try again later."
                    : "No se encontraron conductores en este momento. Por favor, inténtalo de nuevo más tarde.",
                  data
                );
              } else {
                for (const driver of drivers) {
                  send_driver_template(
                    needed.language == "english" ? "en_US" : "es",
                    data,
                    driver
                  );
                  await delay(3000);
                }
              }
            })
            .catch((err) => {
              console.error("Error fetching drivers:", err);
            });
          break;
        case "manage_users":
          const userCount = await getUserCount();
          send_message(
            needed.language == "english"
              ? `👨‍✈️ Hello there! Welcome to the *MOTOCONCHO* User Management 📋! \n\nCurrently, we have *${userCount}* registered users. 🚗`
              : `👨‍✈️ ¡Hola! ¡Bienvenido a la Gestión de Usuarios de *MOTOCONCHO* 📋! \n\nActualmente, tenemos *${userCount}* usuarios registrados. 🚗`,
            data
          );
          await delay(3000);
          send_message("*Please wait while fetching all users* ⏳👨", data);
          await delay(3000);
          User.find({})
            .then(async (users) => {
              // Added async here
              for (const user of users) {
                if (user.banned) {
                  send_button(
                    `👤 *Name:* ${user.fullname}\n📧 *Email:* ${user.email}\n☎️ *Phone:* ${user.phone}`,
                    [{ id: `unban_${user.phone}`, title: "Unban User 🔰" }],
                    data
                  );
                } else {
                  send_button(
                    `👤 *Name:* ${user.fullname}\n📧 *Email:* ${user.email}\n☎️ *Phone:* ${user.phone}`,
                    [{ id: `ban_${user.phone}`, title: "Ban User ❎" }],
                    data
                  );
                }
                await delay(3000);
              }
            })
            .catch((err) => {
              console.error("Error fetching drivers:", err);
            });
          break;

        default:
          break;
      }
      if (data.btn_id.startsWith("confirm_")) {
        send_button(
          needed.language == "english"
            ? "🟢 You have successfully confirmed the trip driver. You can message the driver to continue with the tip discussion ✅🚕"
            : "🟢 Has confirmado exitosamente al conductor del viaje. Puedes enviar un mensaje al conductor para continuar con la discusión del viaje ✅🚕",
          [
            { id: "create_trip", title: "Start a trip 🚕" },
            { id: "cancel_trip", title: "Cancel trip ❎" },
          ],
          data
        );
        await delay(3000);
        send_contact(
          data.btn_id.replace("confirm_", ""),
          usr.fullname,
          data.wa_id,
          data.wa_id
        );
      } else if (data.btn_id.startsWith("ban_")) {
        const phn = data.btn_id.replace("ban_", "");
        console.log(`Banning ${phn}`);
        try {
          const updatedDocument = await User.findOneAndUpdate(
            { phone: phn },
            { $set: { banned: true } },
            { new: true, upsert: true }
          );
          console.log("Updated document:", updatedDocument);
          send_message(
            ` *${updatedDocument.fullname}* has been successfully banned from the platform. 🛑`,
            data
          );
        } catch (error) {
          console.error("Error updating user:", error);
        }
      } else if (data.btn_id.startsWith("unban_")) {
        const phn = data.btn_id.replace("unban_", "");
        console.log(`Unbanning ${phn}`);
        try {
          const updatedDocument = await User.findOneAndUpdate(
            { phone: phn },
            { $set: { banned: false } },
            { new: true, upsert: true }
          );
          console.log("Updated document:", updatedDocument);
          send_message(
            ` *${updatedDocument.fullname}* has been successfully unbanned from the platform. ✅☺️`,
            data
          );
        } catch (error) {
          console.error("Error updating user:", error);
        }
      }
    }

    if (data.type == "button") {
      switch (data.btn_text) {
        case "Delete Driver":
          Driver.deleteOne({ phone: data.btn_payload })
            .then((result) => {
              console.log("Delete result:", result);
              if (result.deletedCount === 1) {
                console.log("User successfully deleted.");
                send_button(
                  `*Driver with phone number ${data.btn_payload} successfully deleted!* ✅🎉`,
                  [{ id: "add_driver", title: "Add New Driver 👨‍✈️" }],
                  data
                );
              } else {
                console.log("No user found with that phone number.");
              }
            })
            .catch((err) => console.error("Error deleting user:", err));
          break;

        case "Add Ticket":
          send_message(
            "How many trip ticket did you want to add for this driver ?",
            data
          );
          needTicket = true;
          wTicket = data.btn_payload;

          break;

        default:
          break;
      }
      if (data.btn_text == "Accept Trip" || data.btn_text == "Aceptar viaje") {
        console.log("trippinggg");
        console.log(data.btn_payload);
        needed.welcome = false;
        needsMap.set(data.to, needed);
        const latestTrip = await Trip.findOne({ phone: data.btn_payload }).sort(
          { _id: -1 }
        );
        if (latestTrip) {
          console.log(latestTrip);
          Driver.find({ phone: `+${data.to}` })
            .then(async (drivers) => {
              for (const driver of drivers) {
                let rticket = driver.ticket;
                console.log(rticket);
                if (parseInt(rticket) > 0) {
                  await Driver.findOneAndUpdate(
                    { phone: driver.phone },
                    { $set: { ticket: rticket - 1 } },
                    { new: true, upsert: true }
                  );
                  await Trip.findOneAndUpdate(
                    { phone: data.btn_payload },
                    { $set: { gotDriver: true, driverId: driver.phone } },
                    { new: true, upsert: true }
                  );
                  send_button(
                    needed.language == "english"
                      ? "🟢 The driver has accepted your trip! \n\nPlease click on the contact below to chat with the driver. 👋🚕"
                      : "🟢 ¡El conductor ha aceptado tu viaje! \n\nPor favor, haz clic en el contacto a continuación para chatear con el conductor. 👋🚕",
                    [
                      {
                        id: `confirm_${data.wa_id}`,
                        title: "Confirm ✅",
                      },
                    ],
                    { ...data, to: data.btn_payload }
                  );
                  send_message(
                    needed.language == "english"
                      ? "🟢 You have successfully accepted the trip. 👋🚕\n\nOnce the user confirm you as the driver, you will receive thier contact. You can wait for it 🔰"
                      : "🟢 Has aceptado el viaje exitosamente. 👋🚕\n\nUna vez que el usuario te confirme como conductor, recibirás su contacto. Puedes esperarlo 🔰",
                    data
                  );
                  await delay(3000);
                  send_contact(
                    data.btn_payload,
                    data.username,
                    data.wa_id,
                    data.wa_id
                  );
                } else {
                  send_message(
                    "You did not have enough ticket to accept this trip. Contact the admin to purchase ticket! ",
                    data
                  );
                }
              }
            })
            .catch((err) => {
              console.error("Error fetching drivers:", err);
            });
        } else {
          send_message(
            "The trip has already been accepted by another driver. Better luck next time !!! ",
            data
          );
        }
      } else if (
        data.btn_text == "Reject Trip" ||
        data.btn_text == "Rechazar viaje"
      ) {
        needed.welcome = false;
        needsMap.set(data.to, needed);
        send_button(
          needed.language == "english"
            ? "🔴 A driver rejected your trip, wait if another driver will accept. "
            : "🔴 Un conductor rechazó tu viaje, espera a que otro conductor lo acepte. 🚕",
          [{ id: "cancel_trip", title: "Cancel trip ❎" }],
          { ...data, to: data.btn_payload }
        );
        send_message("🔴 You have successfully rejected the trip", data);
        needed.welcome = false;

        needsMap.set(data.to, needed);
      }
    }

    if (needTicket && data.msg !== "") {
      if (validateTicket(data) == true) {
        const updatedDocument = await Driver.findOneAndUpdate(
          { phone: wTicket },
          { $set: { ticket: data.msg } },
          { new: true, upsert: true }
        );

        send_message(
          `🟢 You have successfully added ${data.msg}  trip ticket for ${updatedDocument.phone}`,
          data
        );
      } else {
        send_message(validateTicket(data), data);
        needTicket = true;
      }
    }
  } catch (error) {
    res.status(500).json({ error: `Internal server error ${error.message}` });
  }
});

const PORT = process.env.PORT || 4002;
app.listen(PORT, () => {
  console.log(`Server is running on port http://localhost:${PORT}`);
});
