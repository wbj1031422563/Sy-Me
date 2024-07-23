/*
 * @Author: FMC
 * @Date: 2024-07-23 19:46:31
 * @LastEditors: FMC
 * @LastEditTime: 2024-07-23 22:12:16
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
