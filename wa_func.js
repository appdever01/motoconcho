require("dotenv").config();
const axios = require("axios");
const token = process.env.TOKEN;
const base_url = "https://graph.facebook.com/v19.0/286069281263698/messages";
const send_button = (message, btn_list, data) => {
  console.log(btn_list);
  let datax = JSON.stringify({
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to: data.to,
    context: {
      message_id: data.wam_id,
    },
    type: "interactive",
    interactive: {
      type: "button",
      body: {
        text: message,
      },
      action: {
        buttons: btn_list.map((btn) => ({
          type: "reply",
          reply: {
            id: btn.id,
            title: btn.title,
          },
        })),
      },
    },
  });

  let config = {
    method: "post",
    maxBodyLength: Infinity,
    url: base_url,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      Cookie: "ps_l=0; ps_n=0",
    },
    data: datax,
  };

  axios
    .request(config)
    .then((response) => {})
    .catch((error) => {
      console.log(error);
    });
};
const send_message = (message, data) => {
  let datax = JSON.stringify({
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to: data.to,
    context: {
      message_id: data.wam_id,
    },
    type: "text",
    text: {
      preview_url: false,
      body: message,
    },
  });

  let config = {
    method: "post",
    maxBodyLength: Infinity,
    url: base_url,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      Cookie: "ps_l=0; ps_n=0",
    },
    data: datax,
  };

  axios
    .request(config)
    .then((response) => {})
    .catch((error) => {
      console.log(error);
    });
  return true;
};

const send_template = (template_name, media_url, lang, data) => {
  let datax = JSON.stringify({
    messaging_product: "whatsapp",
    type: "template",
    to: data.to,
    context: {
      message_id: data.wam_id,
    },
    template: {
      name: template_name,
      language: {
        code: lang ?? "en_US",
      },
      components: [
        {
          type: "header",
          parameters: [
            {
              type: "image",
              image: {
                link: media_url,
              },
            },
          ],
        },
      ],
    },
  });

  let config = {
    method: "post",
    maxBodyLength: Infinity,
    url: base_url,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      Cookie: "ps_l=0; ps_n=0",
    },
    data: datax,
  };

  axios
    .request(config)
    .then((response) => {})
    .catch((error) => {
      console.log(JSON.stringify(error));
    });
};

const send_location_template = (lang, data, address) => {
  const axios = require("axios");
  let datax = JSON.stringify({
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to: data.to,
    context: {
      message_id: data.wam_id,
    },
    type: "template",
    template: {
      name: "location_confirm",
      language: {
        code: lang ?? "en_US",
      },
      components: [
        {
          type: "body",
          parameters: [
            {
              type: "text",
              text: parseFloat(data.lat).toFixed(4),
            },
            {
              type: "text",
              text: parseFloat(data.long).toFixed(4),
            },
            {
              type: "text",
              text: address,
            },
          ],
        },
        {
          type: "button",
          index: 0,
          sub_type: "url",
          parameters: [
            {
              type: "TEXT",
              text: `${data.lat},${data.long}`,
            },
          ],
        },
      ],
    },
  });

  let config = {
    method: "post",
    maxBodyLength: Infinity,
    url: base_url,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      Cookie: "ps_l=1; ps_n=1",
    },
    data: datax,
  };

  axios
    .request(config)
    .then((response) => {
      console.log("Just taking my own timex");
    })
    .catch((error) => {
      console.log(error);
    });
};

const send_driver_template = (lang, data, driver, trip_accepted) => {
  const axios = require("axios");
  console.log({
    type: "text",
    text: driver.fullname,
  });
  let datax = JSON.stringify({
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to: data.to,
    context: {
      message_id: data.wam_id,
    },
    type: "template",
    template: {
      name: "send_driverr",
      language: {
        code: lang || "en_US",
      },
      components: [
        {
          type: "header",
          parameters: [
            {
              type: "image",
              image: {
                id: driver.vehiclePic,
              },
            },
          ],
        },
        {
          type: "body",
          parameters: [
            {
              type: "text",
              text: `${driver.fullname} -- Ticket Remain: (${driver.ticket})`,
            },
            {
              type: "text",
              text: trip_accepted,
            },

            {
              type: "text",
              text: driver.phone,
            },
            {
              type: "text",
              text: driver.language,
            },
            {
              type: "text",
              text: driver.address,
            },
            {
              type: "text",
              text: driver.vehicleName,
            },
            {
              type: "text",
              text: driver.plateNumber,
            },
          ],
        },
        {
          type: "button",
          sub_type: "quick_reply",
          index: "0",
          parameters: [
            {
              type: "payload",
              payload: driver.phone,
            },
          ],
        },
        {
          type: "button",
          sub_type: "quick_reply",
          index: "1",
          parameters: [
            {
              type: "payload",
              payload: driver.phone,
            },
          ],
        },
      ],
    },
  });

  let config = {
    method: "post",
    maxBodyLength: Infinity,
    url: base_url,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      Cookie: "ps_l=1; ps_n=1",
    },
    data: datax,
  };

  axios
    .request(config)
    .then((response) => {
      console.log(JSON.stringify(response.data));
    })
    .catch((error) => {
      console.log(error);
    });
};

const send_driver_alert = (lang, data, driver) => {
  const axios = require("axios");
  console.log({
    type: "text",
    text: driver.fullname,
  });
  let datax = JSON.stringify({
    messaging_product: "whatsapp",
    recipient_type: "individual",
    context: {
      message_id: data.wam_id,
    },
    to: data.to,
    type: "template",
    template: {
      name: "send_driver_alert",
      language: {
        code: lang || "en_US",
      },
      components: [
        {
          type: "header",
          parameters: [
            {
              type: "image",
              image: {
                id: driver.vehiclePic,
              },
            },
          ],
        },
        {
          type: "body",
          parameters: [
            {
              type: "text",
              text: driver.fullname,
            },

            {
              type: "text",
              text: driver.language,
            },

            {
              type: "text",
              text: driver.vehicleName,
            },
            {
              type: "text",
              text: driver.plateNumber,
            },
          ],
        },
        {
          type: "button",
          sub_type: "quick_reply",
          index: "0",
          parameters: [
            {
              type: "payload",
              payload: driver.phone,
            },
          ],
        },
      ],
    },
  });

  let config = {
    method: "post",
    maxBodyLength: Infinity,
    url: base_url,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      Cookie: "ps_l=1; ps_n=1",
    },
    data: datax,
  };

  axios
    .request(config)
    .then((response) => {
      console.log(JSON.stringify(response.data));
    })
    .catch((error) => {
      console.log(error);
    });
};

const send_image = (caption, id, data) => {
  const axios = require("axios");
  let datax = JSON.stringify({
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to: data.to,
    context: {
      message_id: data.wam_id,
    },
    type: "image",
    image: {
      id: id,
      caption: caption || "",
    },
  });

  let config = {
    method: "post",
    maxBodyLength: Infinity,
    url: base_url,
    headers: {
      "Content-Type": "application/json",

      Authorization: `Bearer ${token}`,
      Cookie: "ps_l=0; ps_n=0",
    },
    data: datax,
  };

  axios
    .request(config)
    .then((response) => {
      console.log(JSON.stringify(response.data));
    })
    .catch((error) => {
      console.log(error);
    });
};
const mark_read = (data) => {
  let datax = JSON.stringify({
    messaging_product: "whatsapp",
    status: "read",
    message_id: data.wam_id,
  });

  let config = {
    method: "put",
    maxBodyLength: Infinity,
    url: "",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      Cookie: "ps_l=0; ps_n=0",
    },
    data: datax,
  };

  axios
    .request(config)
    .then((response) => {
      console.log(JSON.stringify(response.data));
    })
    .catch((error) => {
      console.log(error);
    });
};

const trip_alert = (lang, to, user, trip,data) => {
  const axios = require("axios");
  const lat = parseFloat(trip.location[0]).toFixed(4);
  const long = parseFloat(trip.location[1]).toFixed(4);
  let datax = JSON.stringify({
    messaging_product: "whatsapp",
    recipient_type: "individual",
    context: {
      message_id: data.wam_id,
    },
    to: to,
    type: "template",
    template: {
      name: "trip_alert",
      language: {
        code: lang ?? "en_US",
      },
      components: [
        {
          type: "header",
          parameters: [
            {
              type: "location",
              location: {
                name: "Sousa Dominican | MOTOCONCHO",
                address: `${user.fullname} Location !!`,
                latitude: lat,
                longitude: long,
              },
            },
          ],
        },
        {
          type: "body",
          parameters: [
            {
              type: "text",
              text: user.fullname,
            },
            {
              type: "text",
              text: trip.address,
            },
          ],
        },
        {
          type: "button",
          sub_type: "quick_reply",
          index: "0",
          parameters: [
            {
              type: "payload",
              payload: user.phone,
            },
          ],
        },
        {
          type: "button",
          sub_type: "quick_reply",
          index: "1",
          parameters: [
            {
              type: "payload",
              payload: user.phone,
            },
          ],
        },
      ],
    },
  });

  let config = {
    method: "post",
    maxBodyLength: Infinity,
    url: "https://graph.facebook.com/v13.0/286069281263698/messages",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      Cookie: "ps_l=0; ps_n=0",
    },
    data: datax,
  };

  axios
    .request(config)
    .then((response) => {
      console.log(JSON.stringify(response.data));
    })
    .catch((error) => {
      console.log(error);
    });
};

const send_contact = (to, fullname, number, id,data) => {
  const axios = require("axios");
  let datax = JSON.stringify({
    messaging_product: "whatsapp",
    to: to,
   
    type: "contacts",
    contacts: [
      {
        name: {
          formatted_name: fullname,
          first_name: fullname.split(" ")[0],
        },
        phones: [
          {
            phone: number,
            type: "WORK",
            wa_id: id,
          },
        ],
      },
    ],
  });

  let config = {
    method: "post",
    maxBodyLength: Infinity,
    url: "https://graph.facebook.com/v13.0/286069281263698/messages",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      Cookie: "ps_l=0; ps_n=0",
    },
    data: datax,
  };

  axios
    .request(config)
    .then((response) => {
      console.log(JSON.stringify(response.data));
    })
    .catch((error) => {
      console.log(error);
    });
};
const caddress = async (data) => {
  const options = {
    method: "GET",
    url: "https://address-from-to-latitude-longitude.p.rapidapi.com/geolocationapi",
    params: {
      lat: data.lat,
      lng: data.long,
    },
    headers: {
      "X-RapidAPI-Key": "1521b0be48msh9c73aa75a0cdb94p1d876ejsn60b4d51aea1c",
      "X-RapidAPI-Host": "address-from-to-latitude-longitude.p.rapidapi.com",
    },
  };

  try {
    const response = await axios.request(options);
    return response.data.Results[0];
  } catch (error) {
    console.error(error);
  }
};

module.exports = {
  send_button,
  send_message,
  caddress,
  send_image,
  mark_read,
  send_contact,
  send_location_template,
  send_driver_alert,
  trip_alert,
  send_driver_template,
  send_template,
};
