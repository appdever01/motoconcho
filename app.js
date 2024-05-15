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
  send_driver_alert,
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
  getLanguageMessage,
  delay,
  needed,
} = require("./func");

const admin = process.env.ADMIN || "2347049972537";
const adminNumber = admin.split(",");

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

const newUser = new User({
  fullname: "",
  email: "user@example.com",
  language: "english",
  language: ["", ""],
  phone: "",
});

const newDriver = new Driver({
  fullname: "",
  email: "",
  phone: "",
  language: "",
  address: "",
  vehicleName: "",
  vehiclePic: "",
  plateNumber: "",
});

const newTrip = new Trip({
  location: [],
  destination: [],
  name: "",
  address: "",
  phone: "",
  driverPhone: "",
});

let usr = User({});

let tem = true;
app.post("/webhook", async (req, res) => {
  const data = req.body;
  const isAdmin = adminNumber.some(
    (phoneNumber) => data.to === phoneNumber.trim()
  );

  try {
    const user = await User.findOne({ phone: data.to });
    if (user) {
      needed.language = user.language;
      // console.log("User found:", user);
      usr = user;
      needed.language = usr.language;
      if (tem && !data.msg.startsWith("/")) {
        send_button(
          !isAdmin
            ? ` Welcome back *${user.fullname}*! 🚀🌍 \n\nWe're thrilled to have you on board. You can now start creating your trip and look for drivers within the beautiful city of Sosua, Dominican Republic. 🚗🌴🌞`
            : "Hello *MOTOCONCHO* Admin! 🚀🌍 ! You can now manage trips, users and drivers within the beautiful city of Sosua, Dominican Republic. 🚗🌴🌞",

          [
            { id: "create_trip", title: "Start a trip 🚕" },
            isAdmin ? { id: "admin_menu", title: "Admin menu 📋" } : null,
          ],
          data
        );
        tem = false;
      }
    } else {
      newUser.phone = data.to;
      needed.welcome = true;
      if (needed.welcome && !data.msg.startsWith("/")) {
        send_button(
          getLanguageMessage("welcome_message", needed.language),
          [{ id: "learn_more", title: "Learn more 🚖" }],
          data
        );
        await delay(3500);

        send_button(
          "Hey there! 👋 Could you please choose your language? 🌐",
          languageButtons,
          data
        );
        needed.welcome = false;
      }

      if (needed.name) {
        if (validateName(data) == true) {
          newUser.fullname = data.msg.replace(
            /\b\w+/g,
            (word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
          );
          needed.name = false;
          send_message(
            `👋 Hello ${newUser.fullname}, what is your email? 📧`,
            data
          );
          await delay(1500);
          needed.email = true;
        } else {
          needed.name = true;
          send_message(validateName(data), data);
        }
      }

      if (needed.email && data.msg !== newUser.fullname) {
        console.log(data.msg);

        if (validateMail(data) == true) {
          newUser.email = data.msg;
          needed.email = false;
          needed.location = true;
          send_template(
            "send_image",
            "https://i.ibb.co/fqpf87k/IMG-20240506-210512.jpg",
            needed.language == "englis" ? "en_US" : "es",
            data
          );
        } else {
          needed.email = true;
          send_message(validateMail(data), data);
        }
      }

      if (needed.location && data.msg !== newUser.email) {
        if (validateLocation(data) == true) {
          newTrip.location = [data.lat, data.long];
          needed.location = false;
          const cad = await caddress(data);
          send_button(
            `Your current location has been received 📍🌍. You're almost set! You are currently in ${cad.city}, ${cad.country}.`,
            [{ id: "change_location", title: "Change location 🌍" }],
            data
          );
          send_button(
            !isAdmin
              ? `🎉🎊 Hello *${newUser.fullname}*, Welcome to MOTOCONCHO! 🚀🌍 \n\nWe're thrilled to have you on board. You've been successfully registered with the email ${newUser.email}. 📧👍 You can now start creating your first trip and look for drivers within the beautiful city of Sosua, Dominican Republic. 🚗🌴🌞`
              : "Hello *MOTOCONCHO* Admin! 🚀🌍 ! You can now manage trips, users and drivers within the beautiful city of Sosua, Dominican Republic. 🚗🌴🌞",
            [
              { id: "create_trip", title: "Start a trip 🚕" },
              isAdmin ? { id: "admin_menu", title: "Admin menu 📋" } : null,
            ],

            data
          );

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
      } else if (
        needed.location &&
        data.type !== "location" &&
        data.msg !== newUser.email
      ) {
        needed.location = true;
        send_template(
          "send_image",
          "https://i.ibb.co/fqpf87k/IMG-20240506-210512.jpg",
          null,
          data
        );
      }
    }

    // Getting destination ---------------------------------------------------------
    // Getting destination ---------------------------------------------------------
    // Getting destination ---------------------------------------------------------

    if (
      needed.destination &&
      JSON.stringify(newTrip.location) !==
        JSON.stringify([data.lat.toString(), data.long.toString()])
    ) {
      console.log(data);
      if (validateLocation(data) == true) {
        newTrip.destination = [data.lat, data.long];
        needed.destination = false;
        const cad = await caddress(data);
        const msg = `📍 Your destination coordinates have been successfully saved to ${
          data.name !== "" && data.address !== ""
            ? `${data.name}, ${data.address}`
            : cad.address
        }:\n\n🌐 *Longitude:* ${parseFloat(data.long).toFixed(
          4
        )}\n🌐 *Latitude:*  ${parseFloat(data.lat).toFixed(
          4
        )}\n\nYou're all set to embark on your exciting journey! 🚀🗺 Get ready to explore new horizons! 🌅🌍`;
        newTrip.name = data.name !== "" ? data.name : cad.city;
        newTrip.address = data.address !== "" ? data.name : cad.address;

        console.log(msg);
        send_button(msg, dest_confirm, data);
      } else {
        needed.destination = true;
        send_message(validateLocation(data), data);
      }
    } else if (
      needed.location &&
      data.type !== "location" &&
      data.msg !== newUser.email
    ) {
      send_template(
        "send_image",
        "https://i.ibb.co/fqpf87k/IMG-20240506-210512.jpg",
        null,
        data
      );
      needed.destination = false;
    } else if (
      JSON.stringify(newTrip.location) ==
      JSON.stringify([data.lat.toString(), data.long.toString()])
    ) {
      send_message(
        "⚠️ Warning: Destination cannot be the same as the location ⚠️",
        data
      );
      needed.destination = true;
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
        send_message(
          `*${newDriver.fullname}* is a nice name 👨‍✈️. What's the driver's email? 📧`,
          data
        );
        await delay(1500);
        needed.driver.email = true;
      } else {
        needed.driver.name = true;
        send_message(validateName(data), data);
      }
    }
    if (needed.driver.email && data.msg !== newDriver.fullname) {
      if (validateMail(data) == true) {
        newDriver.email = data.msg;
        needed.driver.email = false;
        needed.driver.phone = true;
        send_message(
          "Please provide the phone number of the driver you are adding ☎️",
          data
        );
      } else {
        needed.driver.email = true;
        send_message(validateMail(data), data);
      }
    }
    if (needed.driver.phone && data.msg !== newDriver.email) {
      if (validatePhone(data) == true) {
        newDriver.phone = data.msg;
        needed.driver.phone = false;
        needed.driver.address = true;
        send_message(
          "Please provide the address of the driver you are adding 🏠",
          data
        );
      } else {
        needed.driver.phone = true;
        send_message(validatePhone(data), data);
      }
    }
    if (needed.driver.address && data.msg !== newDriver.phone) {
      if (validateAddress(data) == true) {
        newDriver.address = data.msg;
        needed.driver.address = false;
        needed.driver.language = true;
        send_message("What language does the driver speaks ? 🗣️🤔", data);
      } else {
        needed.driver.address = true;
        send_message(validateAddress(data), data);
      }
    }
    if (needed.driver.language && data.msg !== newDriver.address) {
      if (validateLanguage(data) == true) {
        newDriver.language = data.msg;
        needed.driver.language = false;
        needed.driver.vehicleName = true;
        send_message(
          "Please provide the name of the vehicle the driver is using 🚗",
          data
        );
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
        send_message(
          `Please provide the picture of the *${newDriver.vehicleName}* vehicle the driver is using 🚙`,
          data
        );
      } else {
        needed.driver.vehicleName = true;
        send_message(validateVehicleName(data), data);
      }
    }
    if (needed.driver.vehicleName && data.msg !== newDriver.language) {
      if (validateVehicleName(data) == true) {
        newDriver.vehicleName = data.msg;
        needed.driver.vehicleName = false;
        needed.driver.vehiclePic = true;
        send_message(
          `Please provide the picture of the *${newDriver.vehicleName}* vehicle the driver is using 🚕`,
          data
        );
      } else {
        needed.driver.vehicleName = true;
        send_message(validateVehicleName(data), data);
      }
    }
    if (needed.driver.vehiclePic && data.msg !== newDriver.vehicleName) {
      if (validatePic(data) == true) {
        newDriver.vehiclePic = data.img_id;
        needed.driver.vehiclePic = false;

        send_message(
          `Please provide the plate number of the *${newDriver.vehicleName}* vehicle the driver is using 🪪`,
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

        newDriver
          .save()
          .then((savedDriver) => {
            console.log("Driver added successfully:", savedDriver);
            send_message("*Please wait a moment* ⏳", data);
            send_driver_template(null, data, newDriver);
            send_button(
              `👨‍✈️ Hello there! Welcome to the *MOTOCONCHO* Driver Management Menu 📋! \n\nCurrently, we have *${driverCount}* registered drivers. 🚗`,
              [
                { id: "add_driver", title: "Add New Driver 👨‍✈️" },
                { id: "view_drivers", title: "View All Drivers 👥 " },
              ],
              data
            );
          })
          .catch((error) => {
            console.error("Error saving user:", error);
          });
      } else {
        needed.driver.plateNumber = true;
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
        needed.language == "englis" ? "en_US" : "es",
        data
      );
    } else if (data.msg == "/menu") {
      send_button(
        !isAdmin
          ? ` Welcome back *${user.fullname}*! 🚀🌍 \n\nWe're thrilled to have you on board. You can now start creating your trip and look for drivers within the beautiful city of Sosua, Dominican Republic. 🚗🌴🌞`
          : "Hello *MOTOCONCHO* Admin! 🚀🌍 ! You can now manage trips, users and drivers within the beautiful city of Sosua, Dominican Republic. 🚗🌴🌞",

        [
          { id: "create_trip", title: "Start a trip 🚕" },
          isAdmin ? { id: "admin_menu", title: "Admin menu 📋" } : null,
        ],
        data
      );
    }
    if (data.type === "interactive") {
      switch (data.btn_id) {
        case "learn_more":
          send_template(
            "learn_more",
            "https://i.ibb.co/TL6pV5v/315-C110-D-6255-4-A54-96-C7-761-F6-AF16-D5-A-1.png",
            needed.language == "englis" ? "en_US" : "es",
            data
          );
          break;
        case "btn_eng":
          newUser.language = "english";
          needed.language = "english";
          send_message("Your language has been set to English 🇬🇧", data);
          delay(2000);
          send_message("Could you kindly tell me your name? 😊👤", data);
          needed.name = true;

          break;
        case "btn_spa":
          newUser.language = "spanish";
          needed.language = "spanish";
          await send_message("Your language has been set to Spanish 🇪🇸", data);

          break;
        case "change_location":
          needed.location = true;
          needed.destination = false;
          send_template(
            "send_image",
            "https://i.ibb.co/fqpf87k/IMG-20240506-210512.jpg",
            needed.language == "englis" ? "en_US" : "es",
            data
          );

          break;
        case "change_destination":
          needed.location = false;
          needed.destination = true;
          send_template(
            "get_dest",
            "https://i.ibb.co/ng2664M/IMG-20240506-210439.jpg",
            needed.language == "englis" ? "en_US" : "es",
            data
          );

          break;
        case "create_trip":
          await delay(1500);
          send_template(
            "get_dest",
            "https://i.ibb.co/ng2664M/IMG-20240506-210439.jpg",
            needed.language == "englis" ? "en_US" : "es",
            data
          );
          needed.destination = true;
          break;

        case "check_driver":
          send_message(
            "*Hang tight while I fetch available drivers for you!* ⏳🚗\n\nFeel free to alert any driver you like 📣, and once they accept your trip, I'll buzz you right back! 📩",
            data
          );
          Driver.find({})
            .then(async (drivers) => {
              // Added async here
              for (const driver of drivers) {
                send_driver_alert(
                  needed.language == "englis" ? "en_US" : "es",
                  data,
                  driver
                );
                await delay(3000);
              }
            })
            .catch((err) => {
              console.error("Error fetching drivers:", err);
            });
          break;
        case "cancel_trip":
          send_button(
            "Your trip has been successfully cancelled ✅〽️",
            [{ id: "create_trip", title: "Start a trip 🚕" }],
            data
          );
          needed.location = false;
          needed.destination = false;

          break;
        case "admin_menu":
          send_button(
            "Hello there! Welcome to the *MOTOCONCHO* Admin Menu 📋!",
            adminBtn,
            data
          );
          break;
        case "manage_driver":
          const driverCount = await getDriverCount();
          send_button(
            `👨‍✈️ Hello there! Welcome to the *MOTOCONCHO* Driver Management Menu 📋! \n\nCurrently, we have *${driverCount}* registered drivers. 🚗`,
            [
              { id: "add_driver", title: "Add New Driver 👨‍✈️" },
              { id: "view_drivers", title: "View All Drivers 👥 " },
            ],
            data
          );
          break;

        case "add_driver":
          send_message(
            "👋 Hey there! What's the name of the driver you are adding? ",
            data
          );
          needed.driver.name = true;

          break;
        case "view_drivers":
          send_message("*Please wait while fetching all drivers* ⏳👨‍✈️", data);
          Driver.find({})
            .then(async (drivers) => {
              // Added async here
              for (const driver of drivers) {
                send_driver_template(
                  needed.language == "englis" ? "en_US" : "es",
                  data,
                  driver
                );
                await delay(3000);
              }
            })
            .catch((err) => {
              console.error("Error fetching drivers:", err);
            });
          break;
        case "manage_users":
          send_message("*Please wait while fetching all users* ⏳👨", data);
          await delay(3000);
          User.find({})
            .then(async (users) => {
              // Added async here
              for (const user of users) {
                send_button(
                  `👤 *Name:* ${user.fullname}\n📧 *Email:* ${user.email}\n☎️ *Phone:* ${user.phone}`,
                  [{ id: `${user.phone}`, title: "Ban User ❎" }],
                  data
                );
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
        newTrip.phone = data.to;
        newTrip.driverPhone = data.btn_id.replace("confirm_", "");
        newTrip
          .save()
          .then(async (savedTrip) => {
            console.log("Trip saved successfully:", savedTrip);
            send_button(
              "🟢 You have successfully confirmed the trip driver. You can message the driver to continue with the tip discussion ✅🚕",
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
          })
          .catch((error) => {
            console.error("Error saving user:", error);
          });
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

        case "Alert Driver":
          trip_alert(
            needed.language == "englis" ? "en_US" : "es",
            data.btn_payload,
            usr,
            newTrip
          );
          send_message(
            "🚨 The driver has been alerted! 🚨\nPlease expect a response soon regarding whether they *Accept* 🟢 or *Reject* 🔴 your trip.",
            data
          );
          break;
        case "Accept Trip":
          send_button(
            "🟢 The driver has accepted your trip! \n\nPlease click on the contact below to chat with the driver. 👋🚕",
            [{ id: `confirm_${data.wa_id}`, title: "Confirm ✅" }],
            { ...data, to: data.btn_payload }
          );
          send_message(
            "🟢 You have successfully accepted the trip. 👋🚕\n\nOnce the user confirm you as the driver, you will receive thier contact. You can wait for it 🔰",
            data
          );
          await delay(3000);
          send_contact(data.btn_payload, data.username, data.wa_id, data.wa_id);

          break;
        case "Reject Trip":
          send_message(
            "🔴 The driver has rejected your trip! \n\nPlease try requesting another driver. 🚕",
            { ...data, to: data.btn_payload }
          );
          send_message("🔴 You have successfully rejected the trip", data);
          needed.welcome = false;
          break;

        default:
          break;
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
