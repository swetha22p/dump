// App.jsx

import React from 'react';
import {useState} from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Form1 from './components/Form1'; 
import GetData from './components/GetData'; 
import Sample from './components/sample';

function App() {
  return (
    <Router>
      <Navbar />
      <Routes>
        <Route path="/" element={<Form1 />} />
        <Route path="/form1" element={<Form1 />} />
        <Route path="/getdata" element={<GetData />} />
      </Routes>
    </Router>
  );
}

export default App;
