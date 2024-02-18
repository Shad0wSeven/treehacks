import './App.css'
import React, { useState, useEffect } from "react";
import Mail from './Mail';
import Dashboard from './Dashboard';
import Login from './Login';
import Profile from './Profile';
import { BrowserRouter as Router, Routes, Route, Link }
  from 'react-router-dom';
import Hotkeys from 'react-hot-keys';
// switch this to server data
// console.log(data) 
import ActionBar from './Components/ActionBar';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./firebase";


export default function App() {
  const [actionOpen, setActionOpen] = React.useState(false)
  const [loggedIn, setLoggedIn] = useState(true);
  const [uid, setUid] = useState();
  // console.log(currentEmail)
  function searchBar() {

    setActionOpen(current => !current);
  }
  useEffect(() => {
    onAuthStateChanged(auth, (user) => {
      if (user) {
        // User is signed in, see docs for a list of available properties
        // https://firebase.google.com/docs/reference/js/firebase.User
        const uid = user.uid;
        // ...
        //   console.log("uid", uid)
        setUid(user.uid);
      } else {
		setLoggedIn(false);
        // User is signed out
        // ...

      }
    });
  }, []);


  return (
    <GoogleOAuthProvider clientId="802850278396-ti1tgm6tuun8qqbl0elq1up6p44u3sh9.apps.googleusercontent.com">
      <nav className="fixed w-full h-16 backdrop-blur-lg  flex flex-wrap items-center justify-between px-2 border-gray-700 border-b mb-0">
        {loggedIn && (<div className="w-full px-4 ml-0 mx-auto flex flex-wrap items-center justify-between">
          <div className="static block justify-start  font-medium leading-relaxed text-white ">
            <a
              className=" inline-block mr-5 py-5 whitespace-nowrap hover:text-blue-500"
              href="/dash"
            >
              Dashboard
            </a>
            <a
              className="inline-block mr-5 py-5  whitespace-nowrap hover:text-blue-500"
              href="/"
            >
              Inbox
            </a>
            <a
              className="inline-block mr-5 py-5  whitespace-nowrap hover:text-blue-500"
              href="#not-done"
            >
              Draft New Message
            </a>

            {/* <a
              className="inline-block mr-5 py-5 whitespace-nowrap hover:text-blue-500"
              href="/gmail">
              Gmail Test
            </a> */}





          </div>
		  <div className="float-right mr-5 text-white font-semibold">

			<a
              className="mr-5 whitespace-nowrap hover:text-blue-500"
              href="/profile"
            >
              {uid}
            </a>
		  </div>
		  

        </div>)} {!loggedIn && (
			<div className="w-full px-4 ml-0 mx-auto flex flex-wrap items-center justify-between">
			<div className="static block justify-start  font-medium leading-relaxed text-white ">
				<a
              className="inline-block mr-5 py-5  whitespace-nowrap hover:text-blue-500"
              href="/"
            >
             Discover Matcha
            </a>
			<a
              className="inline-block mr-5 py-5  whitespace-nowrap hover:text-blue-500"
              href="/"
            >
             Contact Support
            </a>
			<a
              className="inline-block mr-5 py-5  whitespace-nowrap hover:text-blue-500"
              href="/"
            >
             Join Waitlist
            </a>
			</div></div>
		)}
        
      </nav>
      <Hotkeys keyName='ctrl+k,cmd+k' onKeyDown={searchBar}>
        {actionOpen && (
          <ActionBar />
        )}

      </Hotkeys>
      <Router>
        <Routes>
          <Route path="/" element={<Mail />} />
          <Route path="/dash" element={<Dashboard />} />
		  <Route path="/login" element={<Login />} />
		  <Route path="/profile" element={<Profile />} />
        </Routes>
      </Router>
    </GoogleOAuthProvider>
  )
}
