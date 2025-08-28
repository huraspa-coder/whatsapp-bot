// src/botpress-integration.js
import axios from 'axios';
import jwt from 'jsonwebtoken';

const CHAT_BASE = process.env.BOTPRESS_CHAT_BASE || 'https://chat.botpress.cloud';
const WEBHOOK_ID = process.env.BOTPRESS_WEBHOOK_ID; // p.ej. bf9295f7-...
const ENCRYPTION_KEY = process.env.BOTPRESS_CHAT_ENCRYPTION;

// En memoria para pruebas (prod: persistir)
const conversationByUser = new Map();

function makeUserKey(userId) {
  if (!ENCRYPTION_KEY) {
    throw new Error('Falta BOTPRESS_CHAT_ENCRYPTION para auth manual');
  }
  // JWT HS256 => x-user-key
  return jwt.sign({ id: userId }, ENCRYPTION_KEY, { algorithm: 'HS256' });
}

async function ensureConversation(userId) {
  if (conversationByUser.has(userId)) return conversationByUser.get(userId);

  const xUserKey = makeUserKey(userId);
  const url = `${CHAT_BASE}/${WEBHOOK_ID}/conversations`;

  const { data } = await axios.post(
    url,
    {}, // sin body => id autogenerado
    { headers: { 'Content-Type': 'application/json', 'x-user-key': xUserKey } }
  );

  const convId = data?.conversation?.id;
  if (!convId) throw new Error('No llegó conversation.id desde Botpress');
  conversationByUser.set(userId, convId);
  return convId;
}

export async function sendTextToBotpress({ userId, text }) {
  const xUserKey = makeUserKey(userId);
  const conversationId = await ensureConversation(userId);

  const url = `${CHAT_BASE}/${WEBHOOK_ID}/messages`;
  const payload = {
    conversationId,
    payload: { type: 'text', text }
  };

  const { data } = await axios.post(url, payload, {
    headers: { 'Content-Type': 'application/json', 'x-user-key': xUserKey }
  });

  return data;
}
