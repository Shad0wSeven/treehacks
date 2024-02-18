import React, { useState, useEffect } from "react";
import SingleEmail from "./SingleEmail";
// import ReplyRoundedIcon from '@mui/icons-material/ReplyRounded';
// import ReplyAllRoundedIcon from '@mui/icons-material/ReplyAllRounded';
// import ShortcutRoundedIcon from '@mui/icons-material/ShortcutRounded';
// import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
// import ArchiveRoundedIcon from '@mui/icons-material/ArchiveRounded';
// import LabelRoundedIcon from '@mui/icons-material/LabelRounded';
import TextareaAutosize from "react-textarea-autosize";
import "react-quill/dist/quill.snow.css";
import ReactQuill from "react-quill";
import dompurify from "dompurify";
import { FullscreenExit } from "@mui/icons-material";
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

export default function EmailView(props) {
	const apiurl = import.meta.env.VITE_API_URL;
	// console.log(apiurl);
  const [responseVis, setResponseVis] = React.useState(false);
  const [categorySender, setCategorySender] = React.useState(false);
  const [responseLoaded, setResponseLoaded] = React.useState(false);
  const [value, setValue] = useState("");

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
  let currentEmail = props.entireEmail[props.entireEmail.length - 1];
  let id = currentEmail.id;
  let from = currentEmail.from;
  let to = currentEmail.to;
  let time = currentEmail.date;
  let subject = currentEmail.subject;
  let body = currentEmail.bodyHTML;
  let bText = currentEmail.bodyText;
  let reply = currentEmail.from; //TODO: FIX reply to to an actual reply to address

  let clean = dompurify.sanitize(body, { FORBID_TAGS: ["style"] }); //FIXME: not working css wise, possible security risk

  // QUILL STUFF
  let modules = {
    toolbar: [
      [{ header: [1, 2, 3, false] }],
      ["bold", "italic", "underline", "strike", "blockquote"],
      [
        { list: "ordered" },
        { list: "bullet" },
        { indent: "-1" },
        { indent: "+1" },
      ],
      ["link", "image"],
      ["clean"],
    ],
  };

  let formats = [
    "header",
    "bold",
    "italic",
    "underline",
    "strike",
    "blockquote",
    "list",
    "bullet",
    "indent",
    "link",
    "image",
  ];

  // reply=currentEmail.payload.headers[currentEmail.payload.headers.findIndex(function(item, i){return item.name === "Reply-To"})].value // this fails if there is no reply-to header

  //TODO: convert this to pass the data as an email and check everything within the component
  

  function categorize() {
    let type = document.getElementById("SelectType").value;
    // console.log(type);
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
      <div className="wrapper -mt-1 mb-1 pl-0   pb-2 grad h-screen">
		
		{props.entireEmail.slice(0, -1).map((email) => (
			        <SingleEmail 
					entireEmail={email}
					categories={props.categories}
					uid={props.uid}
					open={false}
					 key={email.id}
					 attachments={email.attachments}
				  />))}
			<SingleEmail
					entireEmail={currentEmail}
					categories={props.categories}
					uid={props.uid}
					open={true}
				  />


		
		

        <div className="mb-5 border-b border-gray-700 pb-5"></div>
        <div className="pl-3 pr-3">
          <div className="flex ">
            <div className="float-left w-3/4">
              <h2 className="text-3xl mb-3 font-light text-white">
                <span className="text-gray-400">Reply to </span>
                <span className="font-semibold">{reply}</span>
              </h2>
            </div>
            <div className="float-right w-1/4 py-3">
              <p className="text-sm font-medium ">
                <a className="text-green-500 hover:text-green-700 mr-2 cursor-pointer">
                  Send
                </a>{" "}
                <a className="mr-2 text-pink-500 hover:text-pink-700 cursor-pointer">
                  Send Later
                </a>{" "}
                <a className="text-blue-400 hover:text-blue-600 mr-2 cursor-pointer">
                  Remind
                </a>{" "}
              </p>
            </div>
          </div>
          <div className="overflow-y-scroll">
            <form className="">
              <ReactQuill
                theme="snow"
                value={value}
                modules={modules}
                formats={formats}
                onChange={setValue}
                className="bg-white mt-5 mb-5"
              />
            </form>
            <div className="text-gray-400 p-3 border border-gray-700  rounded-xl mb-20 pb-10">
              <h3 className="text-green-400 font-semibold text-2xl mb-2">
                Reply with GPT ✨
              </h3>

              <form>
                <label
                  className="block text-white text-sm mb-2"
                  htmlFor="gptinput"
                >
                  What do you want to say roughly?
                </label>
                <input
                  type="text"
                  id="gptinput"
                  className="bg-transparent rounded-lg bg-gray-700 text-white !outline-none px-3 py-1 w-full"
                ></input>
                <div className="flex mt-3 gap-10">
                  <div>
                    <label
                      className="block text-white text-sm mb-2"
                      htmlFor="grid-emotion"
                    >
                      How do you want to say it?
                    </label>
                    <select
                      className="block appearance-none bg-gray-700   text-white py-1 px-2 pr-8 rounded-lg leading-tight !outline-none focus:border-gray-500 w-full"
                      id="grid-emotion"
                    >
                      <option>Formally</option>
                      <option>Casually</option>
                      <option>In between</option>
                    </select>
                  </div>
                  <div>
                    <label
                      className="block text-white text-sm mb-2"
                      htmlFor="grid-emotion"
                    >
                      How Long?
                    </label>
                    <select
                      className="block appearance-none bg-gray-700 w-full  text-white py-1 px-2 pr-8 rounded-lg leading-tight !outline-none focus:border-gray-500"
                      id="grid-emotion"
                    >
                      <option>Very Short</option>
                      <option>Short</option>
                      <option>Medium</option>
                      <option>Very Long</option>
                    </select>
                  </div>
                  <div>
                    <label
                      className="block text-white text-sm mb-2"
                      htmlFor="grid-emotion"
                    >
                      Writing Style
                    </label>
                    <select
                      className="block appearance-none bg-gray-700 w-full  text-white py-1 px-2 pr-8 rounded-lg leading-tight !outline-none focus:border-gray-500"
                      id="grid-emotion"
                    >
                      <option>Copy Your Style</option>
                      <option>Use Vanilla GPT</option>
                    </select>
                  </div>
                  <button
                    className="bg-gray-700 hover:bg-gray-400 border-2 border-green-500 text-white font-bold py-2 px-4 h-10 mt-4 rounded-lg focus:outline-none focus:shadow-outline"
                    type="button"
                    onClick={() => {
                      toggleResponse();
                    }}
                  >
                    Let's Go
                  </button>
                </div>
              </form>

              {responseVis && (
                <>
                  <h3 className="mt-3 text-green-400 text-lg font-semibold">
                    GPT Response:
                  </h3>
                  {responseLoaded && (
                    <p>
                      Hi Ariel,
                      <br />
                      <br />
                      I agree with your points, of importance that sounds good.
                      <br />
                      <br /> I'm available on Wednesday at 5 PM. Thanks to you
                      and Stephine for discussing and initiating the SOP
                      drafting process. Looking forward to the meeting!
                      <br />
                      <br />
                      Best,
                      <br />
                      Justin
                    </p>
                  )}
                  {!responseLoaded && (
                    <div className="animate-pulse flex space-x-4 mt-3">
                      <div className="flex-1 space-y-6 py-1">
                        <div className="space-y-3">
                          <div className="grid grid-cols-3 gap-4">
                            <div className="h-2 bg-slate-700 rounded col-span-2"></div>
                            <div className="h-2 bg-slate-700 rounded col-span-1"></div>
                          </div>
                          <div className="h-2 bg-slate-700 rounded"></div>
                          <div className="grid grid-cols-5 gap-4">
                            <div className="h-2 bg-slate-700 rounded col-span-2"></div>
                            <div className="h-2 bg-slate-700 rounded col-span-1"></div>
                            <div className="h-2 bg-slate-700 rounded col-span-2"></div>
                          </div>
                          <div className="grid grid-cols-6 gap-4">
                            <div className="h-2 bg-slate-700 rounded col-span-5"></div>
                            <div className="h-2 bg-slate-700 rounded col-span-1"></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="mt-20 mb-20 h-20"></div>
          </div>
        </div>
      </div>
    </>
  );
}
