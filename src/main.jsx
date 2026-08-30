import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { SnackbarProvider } from "notistack";
import App from "./App";
import AdBar from "./components/AdBar";
import "./index.css";

createRoot(document.getElementById("root")).render(
    <StrictMode>
        <SnackbarProvider maxSnack={3}>
            <App />
            <AdBar position="bottom" />
        </SnackbarProvider>
    </StrictMode>
);
