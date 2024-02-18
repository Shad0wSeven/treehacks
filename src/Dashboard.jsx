import React, { Component, useEffect } from "react";
import Frame from "./Components/Frame";
import Modal from "./Components/Modal";
import Summary from "./Components/Summary";
import { useState } from "react";
import Testcomponent from "./Components/Testcomponent";
import { auth } from "./firebase";
import { onAuthStateChanged } from "firebase/auth";
import { NavLink, redirect, useNavigate } from "react-router-dom";

export default function Dashboard() {
	const apiurl = import.meta.env.VITE_API_URL;
	// console.log(apiurl);
  const [data, setData] = React.useState();
  const [categoryConversion, setCategoryConversion] = React.useState(false);
  const [isShown, setIsShown] = useState(false);
  const [currentEmail, setCurrentEmail] = useState(null); // currently viewed email
  const [summaryShown, setSummaryShown] = useState(false);
  const [categories, setCategories] = useState();
  const [summary, setSummary] = useState();
  const [uid, setUid] = useState();
  const [archiveShown, setArchiveShown] = useState(false);
  const navigate = useNavigate();
//   const [frames, setFrames] = useState([]); // array of frames to be rendered
  const [currentCategory, setCurrentCategory] = useState("NONE");

  useEffect(() => {
    onAuthStateChanged(auth, (user) => {
    //   console.log(user);
      if (user) {
        // User is signed in, see docs for a list of available properties
        // https://firebase.google.com/docs/reference/js/firebase.User
        setUid(user.uid);
      } else {
        // User is signed out
        console.log("user is logged out");
        navigate("/login");
      }
    });
  }, []);

  useEffect(() => {
    if (uid) {
      fetch(`${apiurl}/getlatest/${uid}/20`)
        .then((response) => response.json())
        .then((data) => {
          //   console.log(data);
          setData(data);
        //   console.log("data retrieved");
        })
        .catch((err) => {
          console.log(err.message);
        });
    }
  }, [uid]);

  useEffect(() => {
    if (uid) {
      fetch(`${apiurl}/getcategories/${uid}/`)
        .then((response) => response.json())
        .then((data) => {
          //   console.log(data);
        //   console.log("categories retrieved");
          setCategories(data);
        })
        .catch((err) => {
          console.log(err.message);
        });
    }
  }, [uid]);

  useEffect(() => {
	if (uid) {
		fetch(`${apiurl}/summary/${uid}/`)
		.then((response) => response.json())
		.then((data) => {
		  //   console.log(data);
		  console.log("summary retrieved");
		  setSummary(data);
		})
		.catch((err) => {
		  console.log(err.message);
		});
	}

  }, [uid]);




  //  console.log(categories);
  function closeModal() {
    setCurrentEmail(null);
    setIsShown(false);
  }

  function createCategory(color="#FFFFFF", title="no title", prompt="no prompt", desc="no description provided", type="category") {
	// go to the api at addcategory and add json content to it as a header
	// then refresh the page
	let content = {"color": color, "desc": desc, "prompt": prompt, "title": title, "type": type, "emails": []};
	fetch(`${apiurl}/addcategory/${uid}/`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify(content)
	})
	window.location.reload();
 }

  function toggleSummary() {
    setSummaryShown((current) => !current);
  }

  function handleClick(email, categoryTitle) {
	console.log(email);
	setCurrentEmail(null);
	setIsShown(false);
    if (email != null) {
      if (email != currentEmail) {
        setCurrentEmail(email);

        
      }
	  
    }
	setCurrentCategory(categoryTitle);
    setCurrentEmail(email);
	setIsShown(true);
  }

  function handleSubmit() {
	// get the values from the ID's from the form and print them
	let title = document.getElementById("SelectTitle").value;
	let prompt = document.getElementById("SelectPrompt").value;
	let desc = document.getElementById("SelectDesc").value;
	let type = document.getElementById("SelectType").value;
	let color = "#FFFFFF";
	if(title == "") {
		title = `Untitled ${type}`;
	}
	if(prompt == "") {
		alert("Please enter a prompt");
		return;
	}
	if(desc == "") {
		desc = "No Description";
	}
	createCategory(color, title, prompt, desc, type);
  }

  const LoadingPane = () => {
    return (
      <div className="border border-gray-700 m-5 shadow rounded-2xl p-4 max-w-sm w-full mx-auto">
        <div className="animate-pulse flex space-x-4">
          <div className="flex-1 space-y-6 py-1">
            <div className="h-8 bg-slate-700 rounded"></div>
            <div className="h-2 w-3/4 bg-slate-700 rounded"></div>
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-4">
                <div className="h-2 bg-slate-700 rounded col-span-2"></div>
                <div className="h-2 bg-slate-700 rounded col-span-1"></div>
              </div>

              <div className="h-2 bg-slate-700 rounded"></div>
            </div>
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-4">
                <div className="h-2 bg-slate-700 rounded col-span-2"></div>
                <div className="h-2 bg-slate-700 rounded col-span-1"></div>
              </div>

              <div className="h-2 bg-slate-700 rounded"></div>
            </div>
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-4">
                <div className="h-2 bg-slate-700 rounded col-span-2"></div>
                <div className="h-2 bg-slate-700 rounded col-span-1"></div>
              </div>

              <div className="h-2 bg-slate-700 rounded"></div>
            </div>
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-4">
                <div className="h-2 bg-slate-700 rounded col-span-2"></div>
                <div className="h-2 bg-slate-700 rounded col-span-1"></div>
              </div>

              <div className="h-2 bg-slate-700 rounded"></div>
            </div>
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-4">
                <div className="h-2 bg-slate-700 rounded col-span-2"></div>
                <div className="h-2 bg-slate-700 rounded col-span-1"></div>
              </div>

              <div className="h-2 bg-slate-700 rounded"></div>
            </div>
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-4">
                <div className="h-2 bg-slate-700 rounded col-span-2"></div>
                <div className="h-2 bg-slate-700 rounded col-span-1"></div>
              </div>

              <div className="h-2 bg-slate-700 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (
    !data ||
    !categories ||
    !summary

  ) {
    return (
      <div className="text-white pt-16 grid grid-cols-3 2xl:grid-cols-6  overflow-y-scroll gap-3 ml-5 mr-5">
        <LoadingPane />
        <LoadingPane />
        <LoadingPane />
        <LoadingPane />
        <LoadingPane />
        <LoadingPane />
        <LoadingPane />
        <LoadingPane />
        <LoadingPane />
        <LoadingPane />
        <LoadingPane />
        <LoadingPane />
        <LoadingPane />
        <LoadingPane />
        <LoadingPane />
        <LoadingPane />
        <LoadingPane />
        <LoadingPane />
        <LoadingPane />
        <LoadingPane />
        <LoadingPane />
        <LoadingPane />
        <LoadingPane />
        <LoadingPane />
      </div>
    );
  }
  return (
    <div>
      {isShown && <Modal close={closeModal} uid={uid} email={currentEmail} category={currentCategory} />}

      {summaryShown && (
        <Summary meta={summary} data={data} close={toggleSummary} />
      )}

      <div className="pt-16">
        <div className="w-full flex flex-col items-center">
          <button
            onClick={toggleSummary}
            className="text-gray-400 rounded-lg border-gray-700 hover:bg-gray-700 px-2 py-1 mt-3 border mb-3"
          >
            View Summary
          </button>
        </div>

        <div className="grid grid-cols-3 2xl:grid-cols-6 gap-3 ml-5 mr-5  overflow-y-scroll">
          {categories.filter(category => category.archive != true).map((element) => (

            <Frame
              change={handleClick}
              prompt={element.prompt}
              ids={element.emails}
              title={element.title}
              desc={element.desc}
              key={element.title}
			  uid={uid}
              isProject={
                element.title == "Meetings" ||
                element.title == "Alerts" ||
                element.title == "Automated Updates"
              }
            />
          ))} 

          <div className="bg-transparent m-3 mt-2 rounded-2xl pt-5 h-fit border border-gray-700">
            <div className="ml-5 mr-5">
              <form >
                <select
                  name="Type"
                  id="SelectType"
                  className="bg-transparent border-none text-gray-400  rounded-lg !outline-none block w-full py-2.5 "
                >
                  <option value="category">Category</option>
                  <option value="project">Project</option>
                </select>
                <input
                  className="bg-transparent  text-3xl font-bold mb-1 text-white !outline-none"
                  placeholder="Create a new Category"
				  id="SelectTitle"
                  type="text"
                  name="name"
                />

                <input
                  className="bg-transparent w-full text-gray-300 !outline-none"
                  placeholder="Type a Category Description"
				  id="SelectDesc"
                  type="text"
                  name="name"
                />
                <textarea
                  className="bg-transparent  mt-3 italic  w-full text-gray-300 !outline-none"
                  placeholder="Type what you want to categorize emails by"
				  id="SelectPrompt"
                  type="text"
                  name="name"
                />
              </form>
			  <button
                  className=" mt-3 text-white border bg-transparent border-gray-700 rounded-lg py-1 px-2 hover:bg-gray-700 mb-5 "
                  
			  		onClick={() => {handleSubmit()}}
        
                >Submit</button>
            </div>
          </div>
        

		
		          <button
          className="text-blue-500 text-center mt-20 font-semibold hover:text-blue-700 cursor-pointer mb-20 pb-20"
          onClick={() => {
            setArchiveShown((current) => !current)
          }}
          
        >
          {archiveShown && "Hide"} {!archiveShown && "View"} Archive
        </button>
		{archiveShown && ( categories.filter(category => category.archive == true).map((element) => (
            <Frame
              change={handleClick}
              prompt={element.prompt}
			  ids={element.emails}
              title={element.title}
              desc={element.desc}
              key={element.title}
			  archive={true}
			  uid={uid}
              isProject={
                element.title == "Meetings" ||
                element.title == "Alerts" ||
                element.title == "Automated Updates"
              }
            />
          )))}
		  </div>


      </div>
    </div>
  );
}
