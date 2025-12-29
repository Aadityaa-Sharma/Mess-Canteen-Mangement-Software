import axios from 'axios';
import Cookies from 'js-cookie';

const API = axios.create({
    baseURL: '/api', // Relative path to use Next.js proxy/rewrites
    withCredentials: true, // Send cookies with requests
});

API.interceptors.request.use((req) => {
    const token = Cookies.get('token');
    if (token) {
        req.headers.Authorization = `Bearer ${token}`;
    }
    return req;
});

export default API;
