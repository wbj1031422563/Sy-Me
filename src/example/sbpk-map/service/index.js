// const axios = require('axios');
import axios from 'axios';
export const getData=()=>{
    return axios.get('/sbpk/getData').then(res=>{
        return res.data;
    })
}
