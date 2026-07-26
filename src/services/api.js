import axios from 'axios';

const NODE_API = import.meta.env.VITE_NODE_API_URL;

export const register = (userData) => axios.post(`${NODE_API}/auth/register`, userData);
export const login = (userData) => axios.post(`${NODE_API}/auth/login`, userData);
// Add more API calls as needed