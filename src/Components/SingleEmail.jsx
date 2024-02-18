import React, { useState, useEffect } from "react";
// import ReplyRoundedIcon from '@mui/icons-material/ReplyRounded';
// import ReplyAllRoundedIcon from '@mui/icons-material/ReplyAllRounded';
// import ShortcutRoundedIcon from '@mui/icons-material/ShortcutRounded';
// import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
// import ArchiveRoundedIcon from '@mui/icons-material/ArchiveRounded';
// import LabelRoundedIcon from '@mui/icons-material/LabelRounded';

import "react-quill/dist/quill.snow.css";

import dompurify from "dompurify";

import "../App.css";

const formatDate = (dateString) => {
  const options = {
    hour: "numeric",
    hour12: true,
    month: "long",
    day: "numeric",
    year: "numeric",
    minute: "numeric",
    second: "numeric",
  };
  const parsedDate = Date.parse(dateString);
  return new Date(parsedDate).toLocaleDateString(undefined, options);
};

export default function SingleEmail(props) {
	const apiurl = import.meta.env.VITE_API_URL;
	// console.log(apiurl);
  const [responseVis, setResponseVis] = React.useState(false);
  const [open, setOpen] = React.useState(props.open);
  const [categorySender, setCategorySender] = React.useState(false);
  const [responseLoaded, setResponseLoaded] = React.useState(false);
  const [value, setValue] = useState("");
  const [active, setActive] = useState(false);

  function toggleResponse() {
    setResponseLoaded(false);
    setResponseVis((current) => !current);
    delayToggleLoaded();
  }
  async function delayToggleLoaded() {
    await new Promise((r) => setTimeout(r, 3285));
    setResponseLoaded(true);
  }
  let uid = props.uid;
  let categories = props.categories;
  let currentEmail = props.entireEmail;
  let id = currentEmail.id;
  let from = currentEmail.from;
  let to = currentEmail.to;
  let time = currentEmail.date;
//   console.log(currentEmail);
  
  let subject = currentEmail.subject;
  let body = currentEmail.bodyHTML;
  let bText = currentEmail.bodyText;
  let reply = currentEmail.from; //TODO: FIX reply to to an actual reply to address
  let attachments = currentEmail.Attachments;
  console.log(attachments);
  let clean = dompurify.sanitize(body, { FORBID_TAGS: ["style"] }); //FIXME: not working css wise, possible security risk

  // reply=currentEmail.payload.headers[currentEmail.payload.headers.findIndex(function(item, i){return item.name === "Reply-To"})].value // this fails if there is no reply-to header

  //TODO: convert this to pass the data as an email and check everything within the component

  useEffect(() => {
    if (uid) {
      // go to http://127.0.0.1:5000/checkdone/ to check if email is done
      fetch(`${apiurl}/checkdone/${uid}/${id}`)
        .then((response) => response.json())
        .then((data) => {
          console.log("checkdone:" + data.done);
          setActive(data.done);
        });
    }
  }, [uid, id]);

  const handleClick = () => {
    // go to http://127.0.0.1:5000/toggledone/ to toggle done
    fetch(`${apiurl}/toggledone/${uid}/${id}`)
      .then((response) => response.json())
      .then((data) => {
        // console.log(data);
      });
    setActive((current) => !current);
  };

  function categorize() {
    let type = document.getElementById("SelectType").value;
    console.log(type);
    if (type === "NOSELECT") {
      alert("Please select a category");
      return;
    }
    fetch(`${apiurl}/categorize/${uid}/${id}/${type}`)
      .then((response) => response.json())
      .then((data) => {
        // console.log(data);
        setActive(data.done);
      });
    setCategorySender((current) => !current);
  }

  return (
    <>
      <div className="pl-3 pr-3 border-t border-gray-700 py-3" >

		{!open && (<button className="border-gray-700 w-full text-gray-400 overflow-hidden " onClick={() => {setOpen(true)}}>{formatDate(time)}:  {subject} . . .</button>)}
        {open && (<div className="pb-5 mb-5 ">
		{!props.open && 
			 <button className="border-gray-700 py-3 w-full text-gray-400 overflow-hidden " onClick={() => {setOpen(false)}}>Close</button>}
          <div className="flow-root mb">
            <div className="float-left">
              <h2 className="text-3xl mb-3 font-semibold text-white">
                {subject}
              </h2>
            </div>
            <div className="float-right  py-3">
              <div className="text-sm font-medium ">
                <a className="text-red-500 hover:text-red-700 mr-2 cursor-pointer">
                  Delete
                </a>{" "}
                <a className="mr-2 text-gray-400 hover:text-gray-600 cursor-pointer">
                  Archive
                </a>{" "}
                <button
                  className="text-yellow-500 hover:text-yellow-700 mr-2 cursor-pointer"
                  onClick={() => {
                    setCategorySender((current) => !current);
                  }}
                >
                  Categorize
                </button>{" "}
                <button
                  className="text-green-500 hover:text-green-700 mr-2 cursor-pointer"
                  onClick={() => handleClick()}
                >
                  Mark {!active && "Done"} {active && "not Done"}
                </button>{" "}
              </div>
            </div>
          </div>
          {categorySender && (
            <div className="border  p-3 rounded-xl m-3 text-center border-gray-700">
              <form className="mb-5 ">
                <select
                  name="Type"
                  id="SelectType"
                  className="bg-transparent border-none text-gray-400  rounded-lg !outline-none block w-full py-2.5 "
                >
                  <option value="NOSELECT">Select</option>
                  {categories.map((category) => (
                    <option value={category.title}>{category.title}</option>
                  ))}
                </select>
              </form>
              <button
                className="bg-gray-700 px-5 py-2 border border-transparent rounded-lg text-white hover:border-gray-400 mr-2 cursor-pointer"
                onClick={() => {
                  categorize();
                }}
              >
                Categorize
              </button>
              <button
                className="text-red-500 ml-5 hover:text-red-700"
                onClick={() => {
                  setCategorySender((current) => !current);
                }}
              >
                Close
              </button>
            </div>
          )}

          <div className="flex mb-5">
            <div className="w-3/4 text-left font-bold text-gray-400">
              {from} <span className="font-light text-gray-500">to {to}</span>
            </div>
            <div className="w-1/4 text-gray-500 font-light">
              {formatDate(time)}
            </div>
          </div>

          {/* Email content Here */}
          <div
            className=" bg-white px-5 py-3  b shadow-lg rounded-xl"
            id="email-content"
            dangerouslySetInnerHTML={{ __html: clean }}
          />
        </div>)}
		{/* if attachments is larger than 0 print attachments */}
		{attachments.length > 0 && (<div className="text-white font-semibold  text-2xl mb-1 ">Attachments:</div>)}
		<div className="flex gap-3">
		{attachments.map((attachment) => (
			<>
				<a href={`${apiurl}/getattachment/${uid}/${id}/${attachment.filename}`}><div key={attachment.id} className="text-gray-400 border w-fit px-3 py-1.5 rounded-lg border-gray-700 hover:bg-gray-700">{attachment.filename}</div> </a>
				
			</>

			
			)) }
			</div>
		
        {/* //FIXME: this sometimes overwrites the css badly */}
      </div>
    </>
  );
}
