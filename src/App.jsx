import './App.css'
import Home from './views/home/home.jsx'
import ReactThree from "./views/react-three/react-three.jsx";
import { RouterProvider } from 'react-router-dom';
import router from './router/router.js';
// import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
function App() {

  return (
    <>
      <Home />
      <RouterProvider router={router} />
    </>
  )
}

export default App
