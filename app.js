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
} = require("./wa_func");
const mongoose = require("mongoose");
const app = express();
const { User, Trip, Driver } = require("./db_model/user_model");
const { languageButtons, dest_confirm, adminBtn } = require("./component");
const {
  validateName,
  validateAddress,
  validateLanguage,
  validateDriverAddress,
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
      language: "spanish",
      location: ["", ""],
      isDriver: false,
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
      address: "",
      gotDriver: false,
      driverId: "",
      phone: "",
      driverPhone: "",
    });
    tripMap.set(data.to, newTrip);
  }

  // working with needs map-------------
  // working with needs map-------------
  // working with needs map-------------

  if (needsMap.has(data.to)) {
    needed = needsMap.get(data.to);
  } else {
    needed = {
      name: false,
      location: false,
      welcome: true,
      isDriver: false,
      address: false,
      language: "spanish",
      doingSomething: false,
      driver: {
        name: false,
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
      const driverFound = await Driver.findOne({ phone: `${data.to}` });

      if (driverFound) {
        needed.isDriver = true;
        console.log(needed.isDriver);
      }
      usr = user;
      newUser = user;
      needed.welcome = false;

      needed.language = usr.language;
      needsMap.set(data.to, needed);

      if (
        !needed.doingSomething &&
        !data.msg.startsWith("/") &&
        data.type !== "interactive" &&
        data.type !== "button"
      ) {
        if (isAdmin) {
          send_button(
            needed.language == "english"
              ? "Hello *MOTOCONCHO* Admin! 🚀🌍 ! You can now manage trips, users and drivers within the beautiful city of Sosua, Dominican Republic. 🚗🌴🌞"
              : "Hola *Administrador*! 👋 \n\nahora puedes gestionar viajes, usuarios y conductores dentro de la plataforma! \n\n(en las hermosas comunidades de *Sosua* y *Cabarete* en República Dominicana) 🇩🇴🌴🌞",
            [
              {
                id: "create_trip",
                title:
                  needed.language == "english"
                    ? "Start a trip 🚕"
                    : "comenzar un viaje",
              },
              {
                id: "trip_history",
                title:
                  needed.language == "english"
                    ? "Trip History 📜"
                    : "historiales de viaje",
              },
              {
                id: "admin_menu",
                title:
                  needed.language == "english"
                    ? "Admin menu 📋"
                    : "panel de admin",
              },
            ],

            data
          );
        } else {
          send_button(
            needed.language == "english"
              ? needed.isDriver
                ? `Hello *${newUser.fullname}*! 🚀🌍 \n\nWelcome back to *MOTOCONCHO*. You have ${driverFound.ticket} ticket(s) left. Feel free to start or manage your trips and explore driver options within the beautiful city of Sosua, Dominican Republic. 🚗🌴🌞`
                : `Hello *${newUser.fullname}*! 🚀🌍 \n\nWelcome back to *MOTOCONCHO*. 📧👍 Feel free to start or manage your trips and explore driver options within the beautiful city of Sosua, Dominican Republic. 🚗🌴🌞`
              : needed.isDriver
              ? `¡Hola *${newUser.fullname}*! 🚀🌍 \n\nBienvenido de nuevo a *MOTOCONCHO*. Tienes ${driverFound.ticket} boleto(s) restante(s). Siéntete libre de comenzar o gestionar tus viajes y explorar opciones de conductores dentro de la hermosa ciudad de Sosua, República Dominicana. 🚗🌴🌞`
              : `¡Hola *${newUser.fullname}*! 🚀🌍 \n\nBienvenido de nuevo a *MOTOCONCHO*. Siéntete libre de comenzar o gestionar tus viajes y explorar opciones de conductores dentro de la hermosa ciudad de Sosua, República Dominicana. 🚗🌴🌞`,
            needed.isDriver
              ? [{ id: "trip_history", title: "Trip History 📜" }]
              : [
                  {
                    id: "create_trip",
                    title: needed.language
                      ? "Start a trip 🚕"
                      : "Comenzar un viaje 🚕",
                  },
                  { id: "trip_history", title: "Trip History 📜" },
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
        data.type !== "button" &&
        data.type !== "interactive"
      ) {
        send_button(
          getLanguageMessage("chooseLanguage", needed.language),
          languageButtons(needed.language),
          data
        );
        await delay(3500);
      }

      if (
        needed.name &&
        data.type !== "button" &&
        data.type !== "interactive"
      ) {
        if (validateName(data) == true) {
          newUser.fullname = data.msg.replace(
            /\b\w+/g,
            (word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
          );

          needed.name = false;

          await delay(1500);

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
                      : "Comenzar un",
                },
                { id: "trip_history", title: "Trip History 📜" },
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
                ? `Hello *${newUser.fullname}*! 🚀🌍 \n\nWelcome back to MOTOCONCHO. Feel free to start or manage your trips and explore driver options within the beautiful city of Sosua, Dominican Republic. 🚗🌴🌞`
                : `¡Hola *${newUser.fullname}*! 🚀🌍 \n\nBienvenido de nuevo a MOTOCONCHO.Siéntete libre de comenzar o gestionar tus viajes y explorar opciones de conductores dentro de la hermosa ciudad de Sosua, República Dominicana. 🚗🌴🌞`,
              [
                {
                  id: "create_trip",
                  title:
                    needed.language == "english"
                      ? "Start a trip 🚕"
                      : "Comenzar un viaje 🚕",
                },

                { id: "trip_history", title: "Trip History 📜" },
              ],

              data
            );
          }
          tem = false;
          needed.doingSomething = false;
          newUser
            .save()
            .then((savedUser) => {
              console.log("User saved successfully:", savedUser);
            })
            .catch((error) => {
              console.error("Error saving user:", error);
            });

          userMap.set(data.to, newUser);
          needsMap.set(data.to, needed);
        } else {
          needed.name = true;
          needed.doingSomething = true;
          needsMap.set(data.to, needed);
          send_message(validateName(data), data);
        }
      }
    }

    if (needed.location && data.type == "location") {
      if (validateLocation(data) == true) {
        newTrip.location = [data.lat, data.long];

        send_message(
          needed.language == "english"
            ? `We have received your location! 🌍\n\nPlease tell me where you need to go. For instance:\n\n- I need to visit the Museum in Sosua City\n- I want to explore the Beach`
            : `hemos recibido tu ubicación! 📍\n\nahora, por favor, cuéntanos qué necesitas... por ejemplo:\n\n- necesito una comida de tal restaurante...\n- quiero ir a la playa...`,

          data
        );
        needed.location = false;
        needed.address = true;

        needed.doingSomething = true;
        tripMap.set(data.to, newTrip);
        needsMap.set(data.to, needed);
      } else {
        needed.location = true;
        needed.doingSomething = true;
        send_message(validateLocation(data), data);
      }
    }

    // Getting destination ---------------------------------------------------------
    // Getting destination ---------------------------------------------------------
    // Getting destination ---------------------------------------------------------

    if (needed.address && data.type == "text") {
      console.log(data);
      if (validateAddress(data) == true) {
        newTrip.address = data.msg.trim();

        const msg =
          needed.language == "english"
            ? `📍 We have recieve and saved your location.\n\nYou're all set to embark on your exciting journey! 🚀🗺 Will you like to continue? `
            : `perfecto, hemos recibido y guardado tu informacion. 💾\n\nestás listo para comenzar tu viaje?`;

        tripMap.set(data.to, newTrip);
        needsMap.set(data.to, needed);

        send_button(msg, dest_confirm(needed.language), data);
        needed.address = false;
        needed.doingSomething = false;
        tripMap.set(data.to, newTrip);
        needsMap.set(data.to, needed);
      } else {
        needed.address = true;
        needed.doingSomething = true;
        needsMap.set(data.to, needed);
        send_message(validateAddress(data), data);
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
        needed.doingSomething = true;
        needsMap.set(data.to, needed);
        send_message(getLanguageMessage("providePhone", needed.language), data);
        await delay(1500);
      } else {
        needed.driver.name = true;
        needed.doingSomething = true;
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
        needed.doingSomething = true;
        needsMap.set(data.to, needed);
        send_message(
          getLanguageMessage("provideAddress", needed.language),
          data
        );
        console.log("iffing");
      } else {
        needed.driver.phone = true;
        needed.doingSomething = true;
        needsMap.set(data.to, needed);
        send_message(validatePhone(data), data);
        console.log(data.msg);
      }
    }
    if (needed.driver.address && data.msg !== newDriver.phone) {
      if (validateDriverAddress(data) == true) {
        newDriver.address = data.msg;
        needed.driver.address = false;
        needed.driver.language = true;
        needed.doingSomething = true;
        needsMap.set(data.to, needed);
        send_message(getLanguageMessage("whatLanguage", needed.language), data);
      } else {
        needed.driver.address = true;
        needed.doingSomething = true;
        needsMap.set(data.to, needed);
        send_message(validateDriverAddress(data), data);
      }
    }
    if (needed.driver.language && data.msg !== newDriver.address) {
      if (validateLanguage(data) == true) {
        newDriver.language = data.msg;
        needed.driver.language = false;
        needed.driver.vehicleName = true;
        needed.doingSomething = true;
        needsMap.set(data.to, needed);
        send_message(getLanguageMessage("vehicleName", needed.language), data);
      } else {
        needed.driver.language = true;
        needed.doingSomething = true;
        send_message(validateLanguage(data), data);
      }
    }
    if (needed.driver.vehicleName && data.msg !== newDriver.language) {
      if (validateVehicleName(data) == true) {
        newDriver.vehicleName = data.msg;
        needed.driver.vehicleName = false;
        needed.driver.vehiclePic = true;
        needed.doingSomething = true;
        needsMap.set(data.to, needed);
        send_message(
          needed.language == "english"
            ? `Please provide the picture of the *${newDriver.vehicleName}* vehicle the driver is using 🚙`
            : `Por favor proporciona la imagen del vehículo *${newDriver.vehicleName}* que está usando el conductor 🚙`,
          data
        );
      } else {
        needed.driver.vehicleName = true;
        needed.doingSomething = true;
        needsMap.set(data.to, needed);
        send_message(validateVehicleName(data), data);
      }
    }
    if (needed.driver.vehicleName && data.msg !== newDriver.language) {
      if (validateVehicleName(data) == true) {
        newDriver.vehicleName = data.msg;
        needed.driver.vehicleName = false;
        needed.driver.vehiclePic = true;
        needed.doingSomething = true;
        needsMap.set(data.to, needed);
        send_message(
          needed.language == "english"
            ? `Please provide the picture of the *${newDriver.vehicleName}* vehicle the driver is using 🚕`
            : `Por favor proporciona la imagen del vehículo *${newDriver.vehicleName}* que está usando el conductor 🚕`,
          data
        );
      } else {
        needed.driver.vehicleName = true;
        needed.doingSomething = true;
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
        needed.doingSomething = true;
      } else {
        needed.driver.vehiclePic = true;
        needed.doingSomething = true;
        send_message(validatePic(data), data);
      }
    }
    if (needed.driver.plateNumber && data.type !== "image") {
      if (validatePlate(data) == true) {
        newDriver.plateNumber = data.msg;
        console.log(newDriver.plateNumber);
        needed.driver.plateNumber = false;
        needsMap.set(data.to, needed);
        (newUser.fullname = newDriver.fullname),
          (newUser.language = newDriver.language),
          (newUser.phone = newDriver.phone),
          (newUser.isDriver = true),
          (newUser.location = [""]),
          newDriver
            .save()
            .then((savedDriver) => {
              newUser.save().then((savedDriverUser) => {
                console.log("Driver added as user:", savedDriverUser);
              });
              console.log("Driver added successfully:", savedDriver);
              send_message(
                needed.language == "english"
                  ? "*Please wait a moment* ⏳"
                  : "*Por favor espera un momento* ⏳",
                data
              );
              send_driver_template(null, data, newDriver, 0);
            })
            .catch((error) => {
              console.error("Error saving user:", error);
            });
      } else {
        needed.driver.plateNumber = true;
        needed.doingSomething = true;
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
        languageButtons(needed.language),
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
      needsMap.set(data.to, needed);
      if (isAdmin) {
        send_button(
          needed.language == "english"
            ? "Hello *MOTOCONCHO* Admin! 🚀🌍 ! You can now manage trips, users and drivers within the beautiful city of Sosua, Dominican Republic. 🚗🌴🌞"
            : "Hola *Administrador*! 👋 \n\nahora puedes gestionar viajes, usuarios y conductores dentro de la plataforma! \n\n(en las hermosas comunidades de *Sosua* y *Cabarete* en República Dominicana) 🇩🇴🌴🌞",
          [
            {
              id: "create_trip",
              title:
                needed.language == "english"
                  ? "Start a trip 🚕"
                  : "comenzar un viaje",
            },
            {
              id: "trip_history",
              title:
                needed.language == "english"
                  ? "Trip History 📜"
                  : "historial de viajes",
            },
            {
              id: "admin_menu",
              title:
                needed.language == "english"
                  ? "Admin menu 📋"
                  : "panel de admin",
            },
          ],

          data
        );
      } else {
        const user = await User.findOne({ phone: data.to });
        const bannedUser = await User.findOne({ phone: data.to, banned: true });
        if (!user) {
          needed.welcome = true;
          needed.doingSomething = true;
          needsMap.set(data.to, needed);
        } else {
          send_button(
            needed.language == "english"
              ? needed.isDriver
                ? `Hello *${newUser.fullname}*! 🚀🌍 \n\nWelcome back to *MOTOCONCHO*. You have ${driverFound.ticket} ticket(s) left. Feel free to start or manage your trips and explore driver options within the beautiful city of Sosua, Dominican Republic. 🚗🌴🌞`
                : `Hello *${newUser.fullname}*! 🚀🌍 \n\nWelcome back to *MOTOCONCHO*. 📧👍 Feel free to start or manage your trips and explore driver options within the beautiful city of Sosua, Dominican Republic. 🚗🌴🌞`
              : needed.isDriver
              ? `¡Hola *${newUser.fullname}*! 🚀🌍 \n\nBienvenido de nuevo a *MOTOCONCHO*. Tienes ${driverFound.ticket} boleto(s) restante(s). Siéntete libre de comenzar o gestionar tus viajes y explorar opciones de conductores dentro de la hermosa ciudad de Sosua, República Dominicana. 🚗🌴🌞`
              : `¡Hola *${newUser.fullname}*! 🚀🌍 \n\nBienvenido de nuevo a *MOTOCONCHO*. Siéntete libre de comenzar o gestionar tus viajes y explorar opciones de conductores dentro de la hermosa ciudad de Sosua, República Dominicana. 🚗🌴🌞`,
            needed.isDriver
              ? [{ id: "trip_history", title: "Trip History 📜" }]
              : [
                  {
                    id: "create_trip",
                    title: needed.language
                      ? "Start a trip 🚕"
                      : "Comenzar un viaje 🚕",
                  },
                  { id: "trip_history", title: "Trip History 📜" },
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

        case "terms_policies":
          send_message(
            needed.language == "english"
              ? `📜 Terms and Policies for MOTOCONCHO Bot: \n\nWelcome to MOTOCONCHO Bot! By using our services, you agree to the following terms and policies: \n\n1. Service Usage: \n   - MOTOCONCHO Bot provides automated assistance for trip management and related services. \n   - Users are responsible for the accuracy and completeness of the information provided to the bot. \n\n2. Trip Management: \n   - Users can start, manage, and cancel trips using the bot. \n   - Trips should adhere to local regulations and safety standards. \n\n3. Data Privacy: \n   - MOTOCONCHO Bot respects user privacy and does not share personal information with third parties. \n   - User data is securely stored and used only for trip-related purposes. \n\n4. User Conduct: \n   - Users are expected to communicate respectfully with the bot and other users. \n   - Any misuse or abuse of the bot will result in account suspension. \n\n5. Trip Pricing: \n   - Trips arranged through the bot should adhere to the specified pricing guidelines. \n   - Users should not negotiate prices beyond the set limits. \n\n6. Liability: \n   - MOTOCONCHO Bot is not liable for any incidents or accidents occurring during trips. \n   - Users are responsible for their safety and well-being during trips. \n\n7. Changes to Terms: \n   - MOTOCONCHO Bot reserves the right to update these terms and policies as needed. \n   - Users will be notified of any changes to the terms. \n\nBy using MOTOCONCHO Bot, you agree to abide by these terms and policies. If you have any questions or concerns, please contact our support team.`
              : `📜 Términos y Políticas para el Bot de MOTOCONCHO: \n\n¡Bienvenido al Bot de MOTOCONCHO! Al utilizar nuestros servicios, aceptas los siguientes términos y políticas: \n\n1. Uso del Servicio: \n   - El Bot de MOTOCONCHO proporciona asistencia automatizada para la gestión de viajes y servicios relacionados. \n   - Los usuarios son responsables de la precisión y completitud de la información proporcionada al bot. \n\n2. Gestión de Viajes: \n   - Los usuarios pueden iniciar, gestionar y cancelar viajes utilizando el bot. \n   - Los viajes deben cumplir con las regulaciones locales y normas de seguridad. \n\n3. Privacidad de Datos: \n   - El Bot de MOTOCONCHO respeta la privacidad del usuario y no comparte información personal con terceros. \n   - Los datos de usuario se almacenan de forma segura y se utilizan únicamente con fines relacionados con los viajes. \n\n4. Conducta del Usuario: \n   - Se espera que los usuarios se comuniquen de manera respetuosa con el bot y otros usuarios. \n   - Cualquier mal uso o abuso del bot resultará en la suspensión de la cuenta. \n\n5. Precios de los Viajes: \n   - Los viajes organizados a través del bot deben cumplir con las pautas de precios especificadas. \n   - Los usuarios no deben negociar precios más allá de los límites establecidos. \n\n6. Responsabilidad: \n   - El Bot de MOTOCONCHO no se hace responsable de incidentes o accidentes ocurridos durante los viajes. \n   - Los usuarios son responsables de su seguridad y bienestar durante los viajes. \n\n7. Cambios en los Términos: \n   - El Bot de MOTOCONCHO se reserva el derecho de actualizar estos términos y políticas según sea necesario. \n   - Se notificará a los usuarios de cualquier cambio en los términos. \n\nAl utilizar el Bot de MOTOCONCHO, aceptas cumplir con estos términos y políticas. Si tienes alguna pregunta o inquietud, por favor contacta a nuestro equipo de soporte.`,
            data
          );
          break;
        case "btn_eng":
          newUser.language = "english";
          needed.language = "english";
          send_message("Your language has been set to English 🇬🇧", data);
          await delay(3000);
          console.log(data.type);

          if (
            needed.welcome &&
            !data.msg.startsWith("/") &&
            data.type !== "button"
          ) {
            send_button(
              getLanguageMessage("welcome_message", needed.language),
              [
                { id: "learn_more", title: "Learn more 🚖" },
                { id: "terms_policies", title: "Terms and Policy ℹ️" },
              ],
              data
            );

            send_message(
              needed.language == "english"
                ? "Could you kindly tell me your name? 😊👤"
                : "¿Podrías decirme amablemente tu nombre? 😊👤",
              data
            );
            needed.name = true;
            needed.doingSomething = true;
            tripMap.set(data.to, newTrip);
            needsMap.set(data.to, needed);
          }
          needed.welcome = false;

          needsMap.set(data.to, needed);

          break;
        case "btn_spa":
          newUser.language = "spanish";
          needed.language = "spanish";
          needsMap.set(data.to, needed);
          send_message("Tu idioma se ha establecido en español 🇪🇸", data);
          await delay(3000);
          if (
            needed.welcome &&
            !data.msg.startsWith("/") &&
            data.type !== "button"
          ) {
            send_button(
              getLanguageMessage("welcome_message", needed.language),
              [
                { id: "learn_more", title: "Learn more 🚖" },
                { id: "terms_policies", title: "Terms and Policy ℹ️" },
              ],
              data
            );

            send_message(
              needed.language == "english"
                ? "Could you kindly tell me your name? 😊👤"
                : "¿Podrías decirme amablemente tu nombre? 😊👤",
              data
            );
            needed.name = true;
            needed.doingSomething = true;
            tripMap.set(data.to, newTrip);
            needsMap.set(data.to, needed);
          }

          needed.welcome = false;
          needsMap.set(data.to, needed);

          break;
        case "create_trip":
          console.log("Tripping");
          send_image(
            needed.language == "english"
              ? "to connect with the drivers and make your trip easier, we need your current location… 📍\n\nfollow the steps in the image i sent you!"
              : "para conectarte con los motoconcho y hacer tu viaje más fácil, necesitamos tu ubicación actual… 📍\n\nsigue los pasos en la imagen que te he enviado!",
            "1547748582764664",
            data
          );

          needed.location = true;
          needed.doingSomething = true;
          userMap.set(data.to, newUser);
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
                : "tu información de viaje ha sido enviada a todos nuestros motoconcho disponibles! 📩\n\npor favor, espera a que uno de ellos acepte el viaje y una vez que acepten tu viaje te notificaré de inmediato.",
              data
            );

            needed.doingSomething = false;
            needsMap.set(data.to, needed);
            // Check if gotDriver didn't change to true after 10 minutes and delete the trip if needed
            setInterval(() => {
              Trip.findOne({ phone: `${data.to}`, gotDriver: false }).then(
                (trip) => {
                  console.log(trip);
                  if (trip) {
                    console.log("deleting trip");
                    Trip.deleteOne({
                      phone: `${data.to}`,
                      gotDriver: false,
                    }).then(() => {
                      send_button(
                        needed.language == "english"
                          ? "🚨 Trip Alert! 🚨\n\nYour trip has been automatically cancelled as no drivers accepted it within 10 minutes. Please start a new trip."
                          : "🚨 ¡Alerta de Viaje! 🚨\n\nTu viaje ha sido cancelado automáticamente ya que ningún conductor lo aceptó en 10 minutos. Por favor, inicia un nuevo viaje. ",
                        [
                          { id: "create_trip", title: "Start a new trip 🚕" },
                          { id: "trip_history", title: "Trip History 📜" },
                        ],
                        data
                      );
                    });
                  }
                }
              );
            }, 240000);

            Driver.find({})
              .then(async (drivers) => {
                if (drivers.length === 0) {
                  send_message(
                    needed.language == "english"
                      ? "No drivers found at the moment. Please try again later."
                      : "no se encontraron motoconcho disponibles en este momento! ❌\n\npor favor, inténtalo de nuevo más tarde.",
                    data
                  );
                } else {
                  for (const driver of drivers) {
                    trip_alert(
                      driver.language.toLocaleLowerCase() == "english"
                        ? "en_US"
                        : "es",
                      driver.phone,
                      newUser,
                      newTrip,
                      data
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
          needsMap.set(data.to, needed);
          Trip.deleteOne({ phone: `${data.to}` }).then((result) => {
            send_button(
              needed.language == "english"
                ? "Your trip has been successfully cancelled ✅"
                : "Tu viaje ha sido cancelado exitosamente ✅",
              [{ id: "create_trip", title: "Start a new trip 🚕" }],
              data
            );
          });

          break;

        case "trip_history":
          Trip.find({ phone: `${data.to}` }).then(async (trips) => {
            console.log(trips.length);
            if (trips.length > 0) {
              for (let index = 0; index < trips.length; index++) {
                const trip = trips[index];
                send_message(
                  needed.language == "english"
                    ? `*Trip Details* (${
                        index + 1
                      }) 📅\n\n- *Destination Address*: ${
                        trip.address
                      }\n\n- *User's Phone*: ${
                        trip.phone
                      }\n\n- Driver's Phone: ${
                        trip.driverPhone
                      }\n\n- *Date Created*: ${
                        trip.createdAt
                      }\n\n*MOTOCONCHO © 2024*`
                    : `*Detalles del Viaje* (${
                        index + 1
                      })📅\n\n- *Dirección de Destino*: ${
                        trip.address
                      }\n\n- *Teléfono*: ${
                        trip.phone
                      }\n\n- *Teléfono del Conductor*: ${
                        trip.driverPhone
                      }\n\n- *Fecha de Creación*: ${
                        trip.createdAt
                      }\n\n*MOTOCONCHO © 2024*`,
                  data
                );
                delay(2000);
              }
            } else {
              send_button(
                needed.language == "english"
                  ? "*You haven't created any trips before !!!* 🚫"
                  : "*¡No has creado ningún viaje antes!!!* 🚫",
                [{ id: "create_trip", title: "Start a new trip 🚕" }],
                data
              );
            }
          });
          break;
        case "admin_menu":
          send_button(
            needed.language == "english"
              ? "Hello there! Welcome to the *MOTOCONCHO* Admin Menu 📋!"
              : "¡Hola! ¡Bienvenido al Menú de Administrador de *MOTOCONCHO* 📋!",
            adminBtn(needed.language),
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
          needed.doingSomething = true;
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
              if (drivers.length < 1) {
                send_message(
                  needed.language == "english"
                    ? "No drivers found at the moment. Please try again later."
                    : "No se encontraron conductores en este momento. Por favor, inténtalo de nuevo más tarde.",
                  data
                );
              } else {
                for (const driver of drivers) {
                  console.log(`Driver phoner :::: ${driver.phone}`);
                  Trip.findOne({ driverPhone: `${driver.phone}` })
                    .count()
                    .then((count) => {
                      console.log(`count :::: ${count}`);
                      send_driver_template(
                        needed.language == "english" ? "en_US" : "es",
                        data,
                        driver,
                        count
                      );
                    });

                  await delay(3000);
                }
              }
            })
            .catch((err) => {
              console.error("Error fetching drivers:", err);
            });
          break;
        case "manage_trips":
          Trip.find({}).then(async (trips) => {
            if (trips) {
              for (let index = 0; index < trips.length; index++) {
                const trip = trips[index];
                send_message(
                  needed.language == "english"
                    ? ` *Trip Details* (${
                        index + 1
                      }) 📅\n\n- *Destination Address*: ${
                        trip.address
                      }\n\n- *Phone*: ${trip.phone}\n\n- *Driver's Phone*: ${
                        trip.driverPhone
                      }\n\n- *Date Created*: ${
                        trip.createdAt
                      }\n\n*MOTOCONCHO © 2024*`
                    : ` *Detalles del Viaje* (${
                        index + 1
                      }) 📅\n\n- *Dirección de Destino*: ${
                        trip.address
                      }\n\n- *Teléfono*: ${
                        trip.phone
                      }\n\n- *Teléfono del Conductor*: ${
                        trip.driverPhone
                      }\n\n- *Fecha de Creación*: ${
                        trip.createdAt
                      }\n\n*MOTOCONCHO © 2024*`,
                  data
                );
                delay(2000);
              }
            } else {
              send_button(
                needed.language == "english"
                  ? "*No one has created trips before !!!* 🚫"
                  : "*¡Nadie ha creado viajes antes!!!* 🚫",
                [{ id: "create_trip", title: "Start a new trip 🚕" }],
                data
              );
            }
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
                    `👤 *Name:* ${user.fullname}\n📧 *Phone:* ${user.phone}`,
                    [{ id: `unban_${user.phone}`, title: "Unban User 🔰" }],
                    data
                  );
                } else {
                  send_button(
                    `👤 *Name:* ${user.fullname}\n☎️ *Phone:* ${user.phone}`,
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
          [{ id: "create_trip", title: "Start a new trip 🚕" }],
          data
        );
        await delay(3000);
        send_contact(
          data.btn_id.replace("confirm_", ""),
          usr.fullname,
          data.wa_id,
          data.wa_id,
          data
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
          needed.doingSomething = true;
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
          Driver.find({ phone: `${data.to}` })
            .then(async (drivers) => {
              for (const driver of drivers) {
                console.log(driver);
                let rticket = driver.ticket;
                console.log(rticket);
                if (parseInt(rticket) > 0) {
                  await Driver.findOneAndUpdate(
                    { phone: driver.phone },
                    { $set: { ticket: rticket - 1 } },
                    { new: true, upsert: true }
                  );
                  console.log(`BTNNNNN PAYLOAD::: ${data.btn_payload}`);
                  await Trip.findOneAndUpdate(
                    { phone: data.btn_payload },
                    {
                      $set: {
                        gotDriver: true,
                        driverId: driver.phone,
                        driverPhone: driver.phone,
                      },
                    },
                    { new: true, upsert: true }
                  );
                  console.log(needed.language);

                  send_image(
                    driver.vehiclePic,
                    needed.language == "english"
                      ? `Driver's Information 👤 📋\n\n👤 Full Name: ${driver.name}\n📱 Phone:  ${driver.phone}\n🗣️ Language:  ${driver.language}\n🏠 Address:  ${driver.address}\n🚗 Vehicle Name:  ${driver.vehicleName}\n🪪 Plate Number:  ${driver.plateNumber}`
                      : `Información del Conductor 👤 📋\n\n👤 Nombre Completo: ${driver.name}\n📱 Teléfono:  ${driver.phone}\n🗣️ Idioma:  ${driver.language}\n🏠 Dirección:  ${driver.address}\n🚗 Nombre del Vehículo:  ${driver.vehicleName}\n🪪 Número de Placa:  ${driver.plateNumber}`,
                    { ...data, to: data.btn_payload }
                  );
                  await delay(3000);
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
                  await delay(2000);
                  send_message(
                    needed.language == "english"
                      ? "🚨 Trip Alert! 🚨\n\nPlease ensure that the driver details match and that they have the required jacket. Remember:\n\n- Trips cannot cost more than RD$500 ($10) 💸\n- For any delivery, do not give more than RD$1000 ($20) 💰\n\n*MOTOCONCHO © 2024*"
                      : "🚨 ¡Alerta de Viaje! 🚨\n\nPor favor asegúrate de que los detalles del conductor coincidan y que tengan la chaqueta requerida. Recuerda:\n\n- Los viajes no pueden costar más de RD$500 ($10) 💸\n- Para cualquier entrega, no des más de RD$1000 ($20) 💰\n\n*MOTOCONCHO © 2024*",
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
            needed.language == "english"
              ? " The trip has already been accepted by another driver or has been cancelled. Better luck next time !!! "
              : " El viaje ya ha sido aceptado por otro conductor o ha sido cancelado. ¡Mejor suerte la próxima vez !!! ",
            data
          );
        }
      } else if (
        data.btn_text == "Reject Trip" ||
        data.btn_text == "Rechazar viaje"
      ) {
        needed.welcome = false;
        needsMap.set(data.to, needed);
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
        needTicket = false;

        send_message(
          `🟢 You have successfully added ${data.msg}  trip ticket for ${updatedDocument.phone}`,
          data
        );
      } else {
        send_message(validateTicket(data), data);
        needTicket = true;
        needed.doingSomething = true;
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
