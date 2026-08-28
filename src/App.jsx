import React, {useEffect} from "react";
import { BrowserRouter, Routes, Route } from "react-router";
import AOS from "aos";
import AboutPage from "./screens/AboutPage";
import LoginPage from "./screens/LoginPage";
import FishGame from "./screens/FishGame";
import RulesPage from "./screens/FishGame/RulesPage";
import Tutorial from "./screens/FishGame/Tutorial";

const App = () => {

    useEffect(() => {
        AOS.init();
    }, []);
    
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<FishGame />} />
                <Route path="/rules" element={<RulesPage />} />
                <Route path="/how-to-play" element={<Tutorial />} />
                <Route path="/about" element={<AboutPage />} />
                <Route path="/login" element={<LoginPage />} />
            </Routes>
        </BrowserRouter>
    );
};

export default App;
