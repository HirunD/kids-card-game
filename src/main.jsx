import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { SnackbarProvider } from "notistack";
import App from "./App";
import "./index.css";

createRoot(document.getElementById("root")).render(
    <StrictMode>
        <SnackbarProvider maxSnack={3}>
            <App />
        </SnackbarProvider>
    </StrictMode>
);
