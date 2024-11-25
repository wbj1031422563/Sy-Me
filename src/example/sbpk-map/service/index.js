/*
 * @Author: FMC
 * @Date: 2024-07-23 19:46:31
 * @LastEditors: FMC
 * @LastEditTime: 2024-08-18 09:22:53
 * @FilePath: \fmc-personal-blog\src\example\sbpk-map\service\index.js
 * @Description: 
 */
// const axios = require('axios');
import axios from 'axios';
export const getData=()=>{
    return axios.get('/sbpk/getData').then(res=>{
        return res.data;
    })
}
export const getData2=()=>{
    return axios.get('/sbpk/getData2').then(res=>{
        return res.data;
    })
}
export const getDataQyfb=()=>{
    return axios.get('/sbpk/getDataQyfb').then(res=>{
        return res.data;
    })
}
export const getDataYszb=()=>{
    return axios.get('/sbpk/getDataYszb').then(res=>{
        return res.data;
    })
}

export const getDataFgfb=()=>{
    return axios.get('/sbpk/getDataFgfb').then(res=>{
        return res.data;
    })
}
