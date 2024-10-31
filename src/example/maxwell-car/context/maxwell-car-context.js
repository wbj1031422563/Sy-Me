/*
 * @Author: FMC
 * @Date: 2024-08-28 15:34:17
 * @LastEditors: FMC
 * @LastEditTime: 2024-08-28 15:40:04
 * @FilePath: \fmc-personal-blog\src\example\sbpk-map\context\sbpk-area-context.js
 * @Description: 
 */
import { createContext } from 'react';
import { CAR_COLOR, CAR_SCENE_TYPE } from '../enum/enum';

export const MaxWellContext = createContext({
    sceneType:CAR_SCENE_TYPE.SHOWROOM,
    carColor:CAR_COLOR.BLUE
});