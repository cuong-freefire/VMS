import LoginPage from "./components/pages/LoginPage";
import { Route, Routes } from "react-router-dom";
import { Bounce, ToastContainer } from 'react-toastify'
import HomePage from "./components/pages/Homepage";
import MainLayout from "./components/layouts/MainLayout";
import EventListPage from "./components/pages/EventListPage";
import EventDetailPage from "./components/pages/EventDetailPage";

function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<HomePage />} />
          <Route path="events" element={<EventListPage />} />
          <Route path="events/:id" element={<EventDetailPage />} />
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
