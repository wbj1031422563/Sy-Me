
import * as React from "react";
import * as ReactDOM from "react-dom/client";
import Home from "../views/home/home.jsx"; 
import {
  createBrowserRouter,
  RouterProvider,
} from "react-router-dom";


const router = createBrowserRouter([
    {
      path: "/",
      element: Home(),
    },
  ]);
// export const router = createBrowserRouter([
//     {
//         path: "/",
//         element: <div>Hello world!</div>,
//     },
// ]);
export default router