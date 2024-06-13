"use strict";

const token = process.env.WHATSAPP_TOKEN;
const webhookUrl = process.env.WEBHOOK_URL;

// Imports dependencies and set up http server
const request = require("request"),
  express = require("express"),
  body_parser = require("body-parser"),
  axios = require("axios").default,
  app = express().use(body_parser.json()); // creates express http server

app.listen(process.env.PORT || 1337, () => console.log("webhook is listening"));

app.post("/webhook", (req, res) => {
  let body = req.body;

  console.log(JSON.stringify(req.body, null, 2));

  if (req.body.object) {
    if (
      req.body.entry &&
      req.body.entry[0].changes &&
      req.body.entry[0].changes[0] &&
      req.body.entry[0].changes[0].value.messages &&
      req.body.entry[0].changes[0].value.messages[0]
    ) {
      let wam_id = req.body.entry[0].changes[0].value.messages[0].id;
      let username =
        req.body.entry[0].changes[0].value.contacts[0].profile.name;
      let btn_id = "";
      let msg_body = "";
      let lat = "";
      let long = "";
      let name = "";
      let address = "";
      let img_id = "";
      let btn_text = "";
      let btn_payload = "";

      let type = req.body.entry[0].changes[0].value.messages[0].type;
      if (type == "interactive") {
        btn_id =
          req.body.entry[0].changes[0].value.messages[0].interactive
            .button_reply.id;
      } else if (type == "text") {
        msg_body = req.body.entry[0].changes[0].value.messages[0].text.body;
      } else if (type == "button") {
        btn_text = req.body.entry[0].changes[0].value.messages[0].button.text;
        btn_payload =
          req.body.entry[0].changes[0].value.messages[0].button.payload;
      } else if (type == "image") {
        img_id = req.body.entry[0].changes[0].value.messages[0].image.id;
      } else if (type == "location") {
        lat = req.body.entry[0].changes[0].value.messages[0].location.latitude;
        long =
          req.body.entry[0].changes[0].value.messages[0].location.longitude;
        name = req.body.entry[0].changes[0].value.messages[0].location.name;
        address =
          req.body.entry[0].changes[0].value.messages[0].location.address;
      }
      let phone_number_id =
        req.body.entry[0].changes[0].value.contacts[0].wa_id;
      let display_phone_number =
        req.body.entry[0].changes[0].value.metadata.display_phone_number;
      let from = req.body.entry[0].changes[0].value.messages[0].from;

      // https://moto.tekcify.com/webhook
      //https://e96d-51-195-94-108.ngrok-free.app/webhook
      //https://1870-105-113-17-254.ngrok-free.app
      axios({
        method: "POST",

        url: `${webhookUrl}/webhook`,
        data: {
          wa_id: phone_number_id,
          username: username,
          wam_id: wam_id,
          phone_number: display_phone_number,
          msg: msg_body,
          img_id: img_id,
          to: from,
          type: type,
          lat: lat,
          long: long,
          btn_text: btn_text,
          btn_payload: btn_payload,
          name: name,
          address: address,
          btn_id: btn_id,
        },

        headers: {
          "Content-Type": "application/json",
          "ngrok-skip-browser-warning": "any-value", // Custom header
          "User-Agent": "PostmanRuntime/7.29.2",
        },
      })
        .then((response) => {
          console.log("Response data:", response.data);
          console.log("sent");
        })
        .catch((error) => {
          console.error("Error:", error);
        });
    }
    res.sendStatus(200);
  } else {
    res.sendStatus(404);
  }
});
app.get("/webhook", (req, res) => {
  /**
   * UPDATE YOUR VERIFY TOKEN
   *This will be the Verify Token value when you set up webhook
   **/
  const verify_token = process.env.VERIFY_TOKEN;

  // Parse params from the webhook verification request
  let mode = req.query["hub.mode"];
  let token = req.query["hub.verify_token"];
  let challenge = req.query["hub.challenge"];

  // Check if a token and mode were sent
  if (mode && token) {
    // Check the mode and token sent are correct
    if (mode === "subscribe" && token === verify_token) {
      // Respond with 200 OK and challenge token from the request
      console.log("WEBHOOK_VERIFIED");
      res.status(200).send(challenge);
    } else {
      // Responds with '403 Forbidden' if verify tokens do not match
      res.sendStatus(403);
    }
  }
});
