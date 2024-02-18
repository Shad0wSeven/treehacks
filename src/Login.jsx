import React, { useEffect, useState } from "react";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import { auth } from "./firebase";
import { NavLink, useNavigate } from "react-router-dom";
import axios from "axios";
import { GoogleLogin } from "@react-oauth/google";
import { onAuthStateChanged } from "firebase/auth";

const Login = () => {
	const apiurl = import.meta.env.VITE_API_URL;
	// console.log(apiurl);
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);

  useEffect(() => {
    onAuthStateChanged(auth, (user) => {
      if (user) {
		navigate("/");
      } 
    });
  }, []);


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

  const onGoogleLogin = (uid) => {
    fetch(`${apiurl}/gauth/${uid}/`)
      .then((response) => response.json())
      .then((data) => {
        //   console.log(data);
        console.log(data.url);
        window.open(data.url);
      })
      .catch((err) => {
        console.log(err.message);
      });
  };

  const onLogin = (e) => {
    e.preventDefault();
    signInWithEmailAndPassword(auth, email, password)
      .then((userCredential) => {
        // Signed in
        const user = userCredential.user;

        navigate("/");
        // console.log(user);
      })
      .catch((error) => {
        const errorCode = error.code;
        const errorMessage = error.message;
        console.log(errorCode, errorMessage);
        setError(true);
      });
  };

  const onSubmit = async (e) => {
    e.preventDefault();

    await createUserWithEmailAndPassword(auth, email, password)
      .then((userCredential) => {
        // Signed in
        const user = userCredential.user;
        console.log(user);
        fetch(`${apiurl}/fbsetup/${user.uid}/`);
        // IMPLEMENT FLASK SHIT
        onGoogleLogin(user.uid);
        navigate("/login");
        // ...
      })
      .catch((error) => {
        const errorCode = error.code;
        const errorMessage = error.message;
        console.log(errorCode, errorMessage);
        // ..
      });
  };

  return (
    <>
      <main className="pt-20 ">
        <section>
          <h2 className="text-3xl font-bold text-center text-white mt-20">
            Let's get you logged in
          </h2>
          <div className="centered mt-20 border border-gray-700 px-10 py-5 rounded-xl text-white font-medium">
            <form>
              <div>
                <label htmlFor="email-address">Email address</label>
                <input
                  id="email-address"
                  name="email"
                  type="email"
                  className="w-full px-3 py-2 rounded-lg border border-gray-700 bg-transparent text-white focus:outline-none font-normal focus:border-gray-500 mt-3 mb-5"
                  required
                  placeholder="Email address"
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div>
                <label htmlFor="password">Password</label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  className="w-full px-3 py-2 rounded-lg border border-gray-700 bg-transparent text-white focus:outline-none font-normal focus:border-gray-500 mt-3 mb-1"
                  placeholder="Password"
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              {error && (
                <p className="text-red-500 text-center">Invalid Credentials</p>
              )}

              <div>
                <button
                  onClick={onLogin}
                  className="w-full px-3 py-2 rounded-lg border  border-gray-400 bg-transparent text-white focus:outline-none font-normal hover:border-gray-700 mt-3 mb-5"
                >
                  Login
                </button>
              </div>
            </form>

{/*             <p className="text-sm text-white text-center">
              <button onClick={onSubmit}>
                Create an Account with these Credentials
              </button>
            </p> */}
          </div>
        </section>
      </main>
    </>
  );
};

export default Login;
