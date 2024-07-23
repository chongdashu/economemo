import axios from 'axios';
import https from 'https';

const httpsAgent = new https.Agent({
  rejectUnauthorized: false,
});

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL,
  httpsAgent,
});

export default api;
