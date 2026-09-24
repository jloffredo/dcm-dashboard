import "./App.css";
import ApiKeyGate from "./component/ApiKeyGate.tsx";
import RootLayout from "./component/RootLayout.tsx";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import CaseDashboard from "./page/CaseDashboard.tsx";
import EvidenceDashboard from "./page/EvidenceDashboard.tsx";
import ErrorPage from "./page/ErrorPage.tsx";

const route = createBrowserRouter([
  {
    path: "/",
    element: <RootLayout />,
    children: [
      { id: "home", index: true, element: <CaseDashboard /> },
      {
        id: "case",
        path: "case",
        element: <CaseDashboard />,
      },
      {
        path: "evidence",
        element: <EvidenceDashboard />,
      },
    ],
    errorElement: <ErrorPage />,
  },
]);

function App() {
  return (
    <ApiKeyGate>
      <RouterProvider router={route}></RouterProvider>
    </ApiKeyGate>
  );
}

export default App;