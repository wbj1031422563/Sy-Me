
import Mock from 'mockjs';

Mock.mock('/oop/getData','get',()=>{
   return [{
        name:'张三',
        value:'123'
    }]
})