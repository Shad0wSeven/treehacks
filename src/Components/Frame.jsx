import React, { Component, useState, useEffect } from "react";
import Item from "./Item"
import ProjectItem from "./ProjectItem";
import Draggable, {DraggableCore} from "react-draggable";



function Frame({ change, ids, title, desc, prompt, isProject, uid, archive=false }) {
	const apiurl = import.meta.env.VITE_API_URL;
	// console.log(ids);
	// console.log(apiurl);
	const [updateState , setUpdateState] = useState(false);
	const [showSettings, setShowSettings] = useState(false);
	const [emails, setEmails] = useState([]);
	const [frameType, setFrameType] = useState(isProject); // False => category, True => project
	const [archived, setArchived] = useState(archive);
	// console.log(data)
	// console.log(data[0]);
	useEffect(() => {
		setUpdateState(true);
	}, [updateState]);

	useEffect(() => {
		if (ids) {
			// console.log("i fire once");
				ids.forEach((id) => {
					fetch(`${apiurl}/getid/${uid}/${id}`) //TODO: change to batch all requests at once.
					.then((response) => response.json())
					.then((data) => {
						// console.log(data);
						if(emails.indexOf(data) === -1) {
							setEmails((current) => [...current, data]);
						}
					});
				});

				}
	  }, [ids]);



	function editCategory() {
		let newType = document.getElementById("Select").value;
		let newTitle = document.getElementById("Name").value;
		let newDesc = document.getElementById("Desc").value;
		let newPrompt = document.getElementById("Prompt").value;
		if(newPrompt) {
			alert("Changing prompts is not yet supported, please create a new category.")
			return;
		}
		// construct a json object to send to the backend, only with the fields that have values
		let payload = {};
		if(newType) {
			payload["type"] = newType;
		}
		if(newTitle) {
			payload["title"] = newTitle;
		}
		if(newDesc) {
			payload["desc"] = newDesc;
		}
		

		// go to http://127.0.0.1:5000/modifycategory/<user_id>/<category_id>
		fetch(`${apiurl}/modifycategory/${uid}/${title}`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json"
			},
			body: JSON.stringify(payload)
		})
		.then((response) => response.json())
		.then((data) => {
			console.log(data);
		}
		)
	}

	function archiveCategory() {
		console.log("archiving...");
		let payload = {"archive": true}
		fetch(`${apiurl}/modifycategory/${uid}/${title}`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json"
			},
			body: JSON.stringify(payload)
		})
	}

	function unArchiveCategory() {
		console.log("unarchiving...");
		let payload = {"archive": false}
		fetch(`${apiurl}/modifycategory/${uid}/${title}`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json"
			},
			body: JSON.stringify(payload)
		})
	}




	function toggleSettings() {
		setShowSettings(current => !current);
	}
	const EditMenu = () => (
		<div id="results" className="text-white px-5 pt-3 mb-3 border-t border-gray-700 ">
		  	<form className='mb-5 '>
			  <select name="Type" id="Select"
				className="bg-transparent border-none text-gray-400  rounded-lg !outline-none block w-full py-2.5 ">
				<option value="category">Category</option>
				<option value="project">Project</option>
				</select>
			<input className="bg-transparent  text-3xl font-bold mb-1 text-white !outline-none" placeholder={title} type="text" name="name" id="Name" />

				<input className="bg-transparent w-full text-gray-300 !outline-none" placeholder={desc} type="text" name="name" id="Desc"/>
				<textarea className="bg-transparent  mt-3  w-full text-gray-300 !outline-none" placeholder={prompt} type="text" name="name" id="Prompt" />
				<button className=" mt-3 text-white border border-gray-700 rounded-lg py-1 px-2 hover:bg-gray-700"  onClick={() => {editCategory()}} >Let's Go</button>

				<button className="font-semibold ml-5 text-red-500 mr-3 hover:text-red-700" type="submit">Delete</button>
			{!archived && (
			<button className="font-semibold text-yellow-500 mr-3 hover:text-yellow-700" type="submit" onClick={() => {archiveCategory()}} >Archive</button>)}
			{archived && (
			<button className="font-semibold text-green-500 mr-3 hover:text-yellow-700" type="submit" onClick={() => {unArchiveCategory()}} >Unarchive</button>)}

			</form>


		</div>
	  )
	
  return (
    <>
	
      <div className="bg-transparent m-3 mt-2 rounded-2xl pt-5 h-fit border border-gray-700 ">
        
        <div className="ml-5 ">
			<div className="flow-root">
			<h2 className="text-3xl font-bold mb-1 text-white float-left">{title}</h2> 
			<button className="text-gray-400 float-right mr-5 mt-3" onClick={() => {toggleSettings()}}>Edit</button>
			</div>

          <p className=" text-gray-400  mb-3">{desc}</p>
        </div>
		{!showSettings && (
        	
			<>


				<div className="[&>*:last-child]:border-b w-full"> 
					{emails.map(email => (
		
			<Item className="w-full" email={email} openModal={change} key={email.id} uid={uid} categoryTitle={title}/>
				))}
			</div>
				<p className="text-gray-700 w-full text-center py-3 italic font-semibold hover:text-yellow-500 cursor-pointer">See Older</p>
			</>
      	)}
        
		{showSettings && (
        	<EditMenu />
      	)}


      </div>
    </>
  );
}

export default Frame;