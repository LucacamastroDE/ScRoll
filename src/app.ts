import 'dotenv/config';
import express from 'express';
import {
  InteractionType,
  InteractionResponseType,
  verifyKeyMiddleware,
} from 'discord-interactions';
import { handleApplicationCommand, handleMessageComponent, getCommandSendObject, getMessageComponentSendObj } from './scripts/handler/commandHandler';
import mongoose from 'mongoose';
import fs from 'fs';
import https from 'https';

const credentials = {
  key: fs.readFileSync(process.env.SSLKEYPATH!, 'utf8'), 
  cert: fs.readFileSync(process.env.SSLCERTPATH!, 'utf8'),
  passphrase: process.env.SSLPASSPHRASE,
};
const app = express();
const PORT = process.env.PORT || 3000;
const httpsServer = https.createServer(credentials, app);

mongoose.connect('mongodb://mongodb/scRoll', {})
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.log(err));

app.post('/interactions', verifyKeyMiddleware(process.env.PUBLIC_KEY!), async function (req, res) {

  const { type, data } = req.body;

  let sendObj: unknown = null;

  if (type === InteractionType.PING) {
    return res.send({ type: InteractionResponseType.PONG });
  }

  if (type === InteractionType.APPLICATION_COMMAND) {
    const result = handleApplicationCommand(data.name, data.options);
    sendObj = getCommandSendObject(data.name, result);
  }

  if (type === InteractionType.MESSAGE_COMPONENT) {
    // data.component_type
    const result = await handleMessageComponent(data.custom_id, data.values);
    sendObj = getMessageComponentSendObj(data.custom_id, result);
  }

  if (sendObj) {
    return res.send(sendObj);
  } else {
    const errorMsg = `unknown type: ${type}`;
    console.error(errorMsg);
    return res.status(400).json({ error: errorMsg });
  }
});

httpsServer.listen(PORT);
