import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from "react-router-dom";
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import App from './App.jsx'
import { LanguageProvider } from './context/LanguageContext.jsx';
import { ThemeProvider } from './context/ThemeContext.jsx';
createRoot(document.getElementById('root')).render(

  <StrictMode>
    <BrowserRouter>
<LanguageProvider>
  <ThemeProvider>
    <App />
    </ThemeProvider>
    </LanguageProvider>
    </BrowserRouter>
  </StrictMode>,
)
