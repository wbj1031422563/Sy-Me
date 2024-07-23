/*
 * @Author: FMC
 * @Date: 2024-07-23 19:46:31
 * @LastEditors: FMC
 * @LastEditTime: 2024-07-23 23:10:07
 * @FilePath: \fmc-personal-blog\src\mock\index.js
 * @Description: 
 */

import Mock from 'mockjs';


/**
 * 赛博朋克地图
 */
Mock.mock('/sbpk/getData','get',()=>{
   return [
    {
        zongjine:'2601',
        xingm:'一般事件',
        baifenbi:'0.18'
    },
    {
        zongjine:'1100',
        xingm:'较大事件',
        baifenbi:'0.12'
    },
    {
        zongjine:'4200',
        xingm:'重大事件',
        baifenbi:'0.65'
    },
    {
        zongjine:' 40',
        xingm:'特别重大事件',
        baifenbi:'0.05'
    }
   ]
})
Mock.mock('/sbpk/getData2','get',()=>{
    return [
     {
        country:'中国',
        num:'1973656',
        changeType:'up',
        changeNum:'15.1'
     },
     {
        country:'美国',
        num:'11756',
        changeType:'up',
        changeNum:'4.2'
     },
     {
        country:'英国',
        num:'5006',
        changeType:'down',
        changeNum:'7.8'
     },
     {
        country:'日本',
        num:'13204',
        changeType:'up',
        changeNum:'14.1'
     },
     {
        country:'南非',
        num:'800',
        changeType:'down',
        changeNum:'3.2'
     },
    ]
 })