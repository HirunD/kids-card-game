import React, {useEffect} from "react";
import { BrowserRouter, Routes, Route } from "react-router";
import AOS from "aos";
import AboutPage from "./screens/AboutPage";
import LoginPage from "./screens/LoginPage";
import FishGame from "./screens/FishGame";

const App = () => {

    useEffect(() => {
        AOS.init();
    }, []);
    
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<FishGame />} />
                <Route path="/about" element={<AboutPage />} />
                <Route path="/login" element={<LoginPage />} />
            </Routes>
        </BrowserRouter>
    );
};

export default App;
