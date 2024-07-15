/*
 * @Author: FMC
 * @Date: 2024-07-15 19:50:43
 * @LastEditors: FMC
 * @LastEditTime: 2024-07-15 20:40:45
 * @FilePath: \fmc-personal-blog\src\App.jsx
 * @Description: 
 */
import './App.css'
import Home from './views/home/home.jsx'
import ReactThree from "./views/react-three/react-three.jsx";
import { RouterProvider } from 'react-router-dom';
import router from './router/router.jsx';
// import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
function App() {

  return (
    <>
      <RouterProvider router={router} />
    </>
  )
}

export default App
