import LoginPage from "./components/pages/LoginPage";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Bounce, ToastContainer } from 'react-toastify'
import HomePage from "./components/pages/Homepage";
import MainLayout from "./components/layouts/MainLayout";

import OrganizationListPage from "./components/organizations/OrganizationListPage";
import OrganizationDetailPage from "./components/organizations/OrganizationDetailPage";
import OrganizationFormPage from "./components/organizations/OrganizationFormPage";

function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<HomePage />} />
          

          {/* Temporary Organization Routes */}
          <Route path="organizations" element={<OrganizationListPage />} />
          <Route path="organizations/create" element={<OrganizationFormPage />} />
          <Route path="organizations/:id" element={<OrganizationDetailPage />} />
          <Route path="organizations/edit/:id" element={<OrganizationFormPage />} />
          
          <Route path="" element={<></>} />
        </Route>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<></>} />
      </Routes>
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick={false}
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
        transition={Bounce}
      />
    </>
  );
}

export default App;
