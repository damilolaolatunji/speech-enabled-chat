require('dotenv').config();

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { StreamChat } = require('stream-chat');
const AWS = require('aws-sdk');
const app = express();

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// initialize Stream Chat SDK

const serverSideClient = new StreamChat(
  process.env.STREAM_API_KEY,
  process.env.STREAM_APP_SECRET
);

const polly = new AWS.Polly({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: 'us-east-2',
});

app.post('/speech', async (req, res) => {
  const { text } = req.body;
  let params = {
    Text: text,
    OutputFormat: 'mp3',
    VoiceId: 'Kimberly',
  };

  polly.synthesizeSpeech(params, (err, data) => {
    if (err) {
      console.log(err);
      res.status(500).end();
    } else if (data) {
      if (data.AudioStream instanceof Buffer) {
        res.status(200).send(data);
      }
    }
  });
});

app.post('/join', async (req, res) => {
  const { username } = req.body;
  let token;

  try {
    token = serverSideClient.createToken(username);
    await serverSideClient.updateUser(
      {
        id: username,
        name: username,
      },
      token
    );

    const admin = { id: 'admin' };
    const channel = serverSideClient.channel('team', 'gen2', {
      name: 'General',
      created_by: admin,
    });

    await channel.create();
    await channel.addMembers([username, 'admin']);
  } catch (err) {
    console.log(err);
    return res.status(500).end();
  }

  return res
    .status(200)
    .json({ user: { username }, token, api_key: process.env.STREAM_API_KEY });
});

const server = app.listen(process.env.PORT || 5500, () => {
  const { port } = server.address();
  console.log(`Server running on PORT ${port}`);
});
