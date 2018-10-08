const express = require("express");
const cors = require("cors");
const monk = require("monk");
const Filter = require("bad-words");
const rateLimit = require("express-rate-limit");

const app = express();
const db = monk(process.env.MONGO_URI || "localhost/express_messenger"); // Points to mLab.
const messages = db.get("messages"); 
filter = new Filter(); // Bad words filter.

app.use(cors());
app.use(express.json());


app.get("/", (req, res) => {
  res.send({
    message: "Welcome to the express-mess API! Please goto /messages to see all messages."
  });
});

// Find all messages in DB.
app.get("/messages", (req, res) => {
  messages.find().then(messages => {
    res.json(messages);
  });
});

// Basic blank input checker (use middleware instead).
function isValidMessage(message) {
  return (
    message.name &&
    message.name.toString().trim() !== "" &&
    message.content &&
    message.content.toString().trim() !== ""
  );
}

// Limits POST request, but not GET (that's why it's placed AFTER the GET request).
app.use(
  rateLimit({
    windowMs: 10 * 1000,
    max: 1
  })
);

// On POST, if message is not blank, input is cleaned and pushed to DB. 
app.post("/messages", (req, res) => {
  if (isValidMessage(req.body)) {
    const message = {
      name: filter.clean(req.body.name.toString()),
      content: filter.clean(req.body.content.toString()),
      created: new Date()
    };

    messages.insert(message).then(createdMessage => {
      res.json(createdMessage);
    });
  } else {
    res.status(422);
    res.json({
      message: "Hey, name and content are required fields!"
    });
  }
  console.log(req.body);
});

// App listening on port 5000.
app.listen(5000, () => {
  console.log("Listening on http://localhost:5000");
});
