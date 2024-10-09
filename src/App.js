import './App.css';
import {
  BrowserRouter as Router,
  Routes,
  Route,
} from "react-router-dom";
import { Toaster } from "react-hot-toast";
import Navbar from "./Components/Navbar/Navbar";
import Landing from "./Components/Landing/Landing";

function App() {

  return (

    <>
    <Toaster position="top-right" />
    <Router>
      <Routes>
        <Route exact path="/" element={<><Navbar/><Landing/></>} />
      </Routes>
    </Router>
    </>
    
  );
}

export default App;
