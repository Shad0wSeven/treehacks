import "./App.css";
import React, { useState, useEffect } from "react";
import { NavLink, redirect, useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth } from "./firebase";
import { onAuthStateChanged } from "firebase/auth";

export default function Profile() {
	const apiurl = import.meta.env.VITE_API_URL;
	// console.log(apiurl);
  console.log(auth);
  const [email, setEmail] = useState("");
  const [uid, setUid] = useState("");
  const [name , setName] = useState("");
  const navigate = useNavigate();

  const handleLogout = () => {
    signOut(auth)
      .then(() => {
        // Sign-out successful.
        navigate("/login");
        console.log("Signed out successfully");
      })
      .catch((error) => {
        // An error happened.
      });
  };

  useEffect(() => {
    onAuthStateChanged(auth, (user) => {
      if (user) {
        // User is signed in, see docs for a list of available properties
        // https://firebase.google.com/docs/reference/js/firebase.User
        const uid = user.uid;
        // ...
        console.log("uid", uid);
		
		console.log(user);
        setEmail(user.email);
        setUid(user.uid);
		setName(user.displayName);
		
      } else {
        // User is signed out
        // ...
        console.log("user is logged out");
        navigate("/login");
      }
    });
  }, []);


  if (!auth.currentUser) return <div>NOT AUTHENTICATED.</div>;
  return (
    <div className=" h-screen overflow-y-hidden">
      <div className="w-full pt-16  pl-6 pr-6 border-gray-700 text-white  mt-20 pb-20 font-medium text-xl max-w-screen-lg m-auto">
		<h1 className="text-2xl font-bold mb-3">Settings and Profile</h1>
        <p></p>
		<p className="text-lg font-thin ">Registered Email: {email}</p>
        <p className="text-sm font-thin text-gray-500 ">UUID: {uid}</p>

		<div>
		<form className=" mt-5 mb-5 ">
    <div className="grid gap-6 mb-6 md:grid-cols-2  text-white">
        <div>
            <label for="first_name" className="block mb-2 text-sm font-medium ">First name</label>
            <input type="text" id="first_name" className=" border   text-sm rounded-lg   block w-full p-2.5 bg-gray-700 border-gray-600 placeholder-gray-400 text-white ring-blue-500 focus:border-blue-500" placeholder="John" required/>
        </div>
        <div>
            <label for="last_name" className="block mb-2 text-sm font-medium  ">Last name</label>
            <input type="text" id="last_name" className="border   text-sm rounded-lg   block w-full p-2.5 bg-gray-700 border-gray-600 placeholder-gray-400 text-white ring-blue-500 focus:border-blue-500" placeholder="Doe" required/>
        </div>
        

</div>
<button type="submit" className="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm w-full sm:w-auto px-5 py-2.5 text-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800">Update</button>
</form>
		</div>
		<button
          onClick={handleLogout}
          className="text-red-500 mt-5 centered font-bold text-lg"
        >
          Logout
        </button>
      </div>
	  
    </div>
  );
}
