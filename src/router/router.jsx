/*
 * @Author: FMC
 * @Date: 2024-07-15 19:50:43
 * @LastEditors: FMC
 * @LastEditTime: 2024-08-29 20:46:34
 * @FilePath: \fmc-personal-blog\src\router\router.jsx
 * @Description:
 */
/* eslint-disable react-refresh/only-export-components */

import {
  createBrowserRouter,
  createRoutesFromElements,
  Route,
} from "react-router-dom";
import { lazy, Suspense } from "react";
const  LoadingPage=lazy(() => import('../views/loading-page/loading-page.jsx'));
const StudioLayout = lazy(() => import("../views/studio/StudioLayout.jsx"));
const StudioHome = lazy(() => import("../views/studio/StudioHome.jsx"));
const SceneLibraryPage = lazy(() => import("../views/studio/SceneLibraryPage.jsx"));
const AssetCatalogPage = lazy(() => import("../views/studio/AssetCatalogPage.jsx"));
const DiagnosticsPage = lazy(() => import("../views/studio/DiagnosticsPage.jsx"));
const routerList=[
  {
    path:'/',
    component:lazy(()=>import('../views/home/home.jsx'))
  },
  {
    path:'/sbpk-map',
    component:lazy(()=>import('../example/sbpk-map/sbpk-map.jsx'))
  },
  {
    path:'/maxwell-car',
    component:lazy(()=>import('../example/maxwell-car/maxwell-car.jsx'))
  },
  {
    path:'/viewer/harvester',
    component:lazy(()=>import('../views/scene-viewer-page/harvester-page.jsx'))
  },
  {
    path:'/viewer/:sceneId',
    component:lazy(()=>import('../views/scene-viewer-page/ShowroomViewerPage.jsx'))
  },
  {
    path:'/tools/asset-workbench',
    component:lazy(()=>import('../features/asset-workbench/AssetWorkbench.jsx'))
  },
]


const router = createBrowserRouter(
  createRoutesFromElements(
    <Route>
      {
        routerList.map((item,index)=>{
          return <Route key={index} path={item.path} element={
            <Suspense fallback={<LoadingPage/>}>
              <item.component/>
            </Suspense>
          }></Route>
        })
      }
      <Route path="/studio" element={<Suspense fallback={<LoadingPage />}><StudioLayout /></Suspense>}>
        <Route index element={<Suspense fallback={<LoadingPage />}><StudioHome /></Suspense>} />
        <Route path="scenes" element={<Suspense fallback={<LoadingPage />}><SceneLibraryPage /></Suspense>} />
        <Route path="assets" element={<Suspense fallback={<LoadingPage />}><AssetCatalogPage /></Suspense>} />
        <Route path="diagnostics" element={<Suspense fallback={<LoadingPage />}><DiagnosticsPage /></Suspense>} />
      </Route>
    </Route>
  )
);

export default router;
