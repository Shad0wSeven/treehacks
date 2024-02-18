import "./App.css";
import React, { useState, useEffect } from "react";
import Preview from "./Components/Preview";
import EmailView from "./Components/EmailView";
import SingleEmail from "./Components/SingleEmail";
import KeyboardArrowDownOutlinedIcon from "@mui/icons-material/KeyboardArrowDownOutlined";
import KeyboardArrowUpOutlinedIcon from "@mui/icons-material/KeyboardArrowUpOutlined";
import { NavLink, redirect, useNavigate } from "react-router-dom";
import { auth } from "./firebase";
import { onAuthStateChanged } from "firebase/auth";
import Fuse from "fuse.js";
import { Link } from "react-router-dom";

export default function Mail() {
  const apiurl = import.meta.env.VITE_API_URL;
  // console.log(apiurl);
  const [data, setData] = React.useState([]);
  const [filter, setFilter] = React.useState("INBOX");
  const [uid, setUid] = useState();
  const [currentEmail, setCurrentEmail] = useState([]);
  const [categories, setCategories] = React.useState([]);
  const [searchResults, setSearchResults] = React.useState();
  const navigate = useNavigate();
  const queryParameters = new URLSearchParams(window.location.search);
  const uuid = queryParameters.get("uuid");
  const [loading, setLoading] = useState(false);
  const [pages, setPages] = useState(1);
  const options = {
    keys: ["subject", "bodyText", "from", "labels"],
  };

  function search(query) {
    let fuse = new Fuse(data, options);
    if (!query) {
      console.log("query is null");
      return null;
    }
    if (!fuse) {
      console.log("fuse is null");
      return [];
    }
    const result = fuse.search(query);
    console.log(result);
    return result.map((result) => result.item);
  }

  function SearchResults(props) {
    if (!props.results) {
      return null;
    }

    if (!props.results.length) {
      return <p>There are no results for your query.</p>;
    }

    return (
      <ol className=" overflow-y-scroll max-h-96 pb-5  z-99  px-3 py-3 ">
        {props.results.map((result) => (
          <div className="border-b pb-1 mb-1 border-gray-700 z-99">
            <Link reloadDocument key={result.id} to={"/?uuid=" + result.id}>
              <li>{result.subject}</li>
            </Link>
          </div>
        ))}
        <li className="italic text-gray-500">No More Results. . .</li>
      </ol>
    );
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
        // User is signed out
        // ...
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
          setCurrentEmail(data[0]);
          let email = data[0];
          let threadID = email.threadId;
          let filteredData = data.filter((item) => item.threadId == threadID);
          setCurrentEmail(filteredData.reverse());
        })
        .catch((err) => {
          console.log(err.message);
        });
    }
  }, [uid]);

  useEffect(() => {
    if (uuid != null) {
      try {
        console.log(uuid);
        let x = Object.values(data).find((item) => item.id == uuid);
        // console.log(x);
        if (x == null) {
          console.log("x is null");
          x = fetch(`${apiurl}/getid/${uid}/${uuid}`)
            .then((response) => response.json())
            .then((returnData) => {
              console.log(returnData);
              if (returnData == []) {
                console.log("data is null");
                return null;
              }
              let email = returnData;
              let threadID = email.threadId;
              let filteredData = data.filter(
                (item) => item.threadId == threadID
              );
              if (filteredData.length == 0) {
                filteredData = [email];
              }
              console.log(filteredData);
              setCurrentEmail(filteredData.reverse());
            });
        } else {
          let email = x;
          let threadID = email.threadId;
          let filteredData = data.filter((item) => item.threadId == threadID);
          if (filteredData.length == 0) {
            filteredData = [x];
          }
          // console.log(filteredData);
          setCurrentEmail(filteredData.reverse());
        }
      } catch {
        console.log("Error setting email");
      }
    }
  }, [data]);

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

  const LoadingPane = () => {
    return (
      <div className=" m-5 shadow p-4 max-w-sm w-full mx-auto">
        <div className="animate-pulse flex space-x-4">
          <div className="rounded-full bg-slate-700 h-10 w-10"></div>
          <div className="flex-1 space-y-6 py-1">
            <div className="h-2 bg-slate-700 rounded"></div>
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

  async function nextPage() {
    //FIXME: needs two clicks to work
    console.log("next page");
    setLoading(true);
    let pageToken = await fetch(
      `${apiurl}/getpagetoken/${uid}/${data.length}`
    ).then((response) => response.json());

    let nextPageToken = pageToken["pageToken"];

    fetch(`${apiurl}/getnextpage/${uid}/${nextPageToken}`)
      .then((response) => response.json())
      .then((responseData) => {
        let newData = data.concat(responseData);
        setData(newData);
        console.log(data);
        setPages(pages + 1);
        setLoading(false);
      });
  }

  function multiCategory(categories) {
	let returnArray = [];
	for (let i = 0; i < categories.length; i++) {
		let category = categories[i];
		let z = findCategories(category.id);
		z.split(", ").forEach((item) => {
			if (!returnArray.includes(item) && item != "None") {
				returnArray.push(item);
			}
		});
	}
	let string = "";

	returnArray.forEach((item) => {
		if (string != "") {
			string += ", ";
		}
		string += item;
	});
	if(string == "") {
		return "None";
	}
	return string;
  }


  function findCategories(id) {
    let toReturn = "";
    for (let i = 0; i < categories.length; i++) {
      let item = categories[i];
      if (item.emails.includes(id)) {
        if (toReturn != "") {
          toReturn += ", ";
        }
        toReturn += item.title;
      }
    }
    if (toReturn == "") {
      return "None";
    }
    return toReturn;
  }

  //   console.log(currentEmail)
  const updateEmail = (email, e) => {
    // e.preventDefault();
    // console.log('The link was clicked.');

    // filter data for all emails with the same threadID as email and set them as currentEmail
    let threadID = email.threadId;
    let filteredData = data.filter((item) => item.threadId == threadID);
    // console.log(filteredData.length);

    setCurrentEmail(filteredData.reverse());
    document.title = `${email.subject}`;
    // console.log(currentEmail);
  };

  if (data.length === 0 || !categories || !currentEmail) {
    return (
      <div className=" h-screen overflow-y-hidden">
        <div className="w-full pt-16 pb-8 border-b pl-6 pr-6 border-gray-700 text-white"></div>
        <div className="flex h-full">
          <div className="w-96 overflow-hidden overflow-y-scroll h-full border-r border-gray-700 ">
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
            <p className="text-blue-500 text-center pt-5 font-semibold hover:text-blue-700 cursor-pointer mb-20 pb-20">
              Load More
            </p>
          </div>
          <div className="w-full overflow-y-scroll p-t-0 h-full"></div>
        </div>
        <div className="absolute bottom-0 z-99 w-full darkblue bg-blend-darken border-t px-5 py-2 text-sm border-gray-700 text-gray-400 flow-root">
          <div className="float-left font-semibold">
            Page 1 <span className="font-normal text-gray-500">of . . .</span>
          </div>
          <div className="float-right w-3/4 flex">
            <div className="">
              {/* <span className="font-bold ml-20 mr-3 text-orange-500">Projects:</span>  Matcha  */}{" "}
              {/*TODO: Fix This */}
            </div>
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className=" h-screen overflow-y-hidden">
      <div className="w-full pt-16 border-b pl-6 pr-6 border-gray-700 text-white">
        <div className="fixed top-0 centered pt-4">
          <form
            onSubmit={(event) => {
              event.preventDefault();
              const query = event.target.elements.query.value;
              console.log(query);
              setSearchResults(search(query));
            }}
          >
            <input
              className="bg-transparent rounded-full border px-5 py-1 ml-5 w-96 border-gray-700 mr-3  text-white !outline-none"
              placeholder="Search for Anything. . ."
              type="search"
              id="query"
            />

            <button className="font-semibold">Search</button>
          </form>
        </div>
        <div className="darkblue rounded-lg centered border border-gray-700 mt-2">
          <SearchResults results={searchResults} />
        </div>
        <button
          className="inline-block mr-5 py-2 text-green-400 font-semibold whitespace-nowrap hover:text-green-600"
          onClick={(filter) => setFilter("INBOX")}
        >
          Inbox
        </button>
        <button
          className="inline-block mr-5 py-2 text-blue-400 font-semibold whitespace-nowrap hover:text-blue-600"
          onClick={(filter) => setFilter(null)}
        >
          All
        </button>
        <button
          className="inline-block mr-5 py-2 text-yellow-400 font-semibold whitespace-nowrap hover:text-yellow-600"
          onClick={(filter) => setFilter("STARRED")}
        >
          Starred
        </button>
        <button
          className="inline-block mr-5 py-2 text-purple-400 font-semibold whitespace-nowrap hover:text-purple-600"
          onClick={(filter) => setFilter("SENT")}
        >
          Sent/Scheduled
        </button>
        <button
          className="inline-block mr-5 py-2 text-gray-400 font-semibold whitespace-nowrap hover:text-gray-600"
          onClick={(filter) => setFilter("DRAFTS")}
        >
          Drafts
        </button>
        <button
          className="inline-block mr-5 py-2 text-orange-400 font-semibold whitespace-nowrap hover:text-orange-600"
          onClick={(filter) => setFilter("SPAM")}
        >
          Spam
        </button>
        <button
          className="inline-block mr-5 py-2 text-red-400 font-semibold whitespace-nowrap hover:text-red-600"
          onClick={(filter) => setFilter("TRASH")}
        >
          Trash
        </button>

		<a className="mr-5 unselect">|</a>

		<button
          className="inline-block mr-5 py-2 text-green-500 font-semibold whitespace-nowrap hover:text-green-600"
          onClick={(filter) => setFilter("CATEGORY_PROMOTIONS")}
        >
          Promotions
        </button>

		<button
          className="inline-block mr-5 py-2 text-orange-400 font-semibold whitespace-nowrap hover:text-orange-600"
          onClick={(filter) => setFilter("CATEGORY_UPDATES")}
        >
          Updates
        </button>

		<button
          className="inline-block mr-5 py-2 text-blue-400 font-semibold whitespace-nowrap hover:text-blue-600"
          onClick={(filter) => setFilter("CATEGORY_SOCIAL")}
        >
          Social
        </button>

		<button
          className="inline-block mr-5 py-2 text-purple-400 font-semibold whitespace-nowrap hover:text-purple-600"
          onClick={(filter) => setFilter("CATEGORY_FORUMS")}
        >
          Forums
        </button>

        <KeyboardArrowDownOutlinedIcon className="float-right cursor-pointer  mt-2" />
        <KeyboardArrowUpOutlinedIcon className="float-right cursor-pointer mr-3 mt-2" />
      </div>
      <div className="flex h-full">
        <div className="w-96 overflow-hidden overflow-y-scroll h-full border-r border-gray-700 ">
          {Object.values(data).filter(email => email.labels.indexOf(filter) != -1).map((email) => (
            <div key={email.id}>
              <a onClick={(e) => updateEmail(email, e)}>
                <Preview
                  subject={email.subject}
                  body={email.bodyText}
                  time={email.date}
                  from={email.from}
                  labels={email.labels}
                />
              </a>
            </div>
          ))}
          <button
            className="text-blue-500 text-center pt-5 font-semibold hover:text-blue-700 cursor-pointer mb-20 pb-20 pl-5"
            onClick={() => {
              nextPage();
            }}
          >
            {loading ? "Loading..." : "Load More"}
          </button>
        </div>
        <div className="w-full overflow-y-scroll p-t-0 h-full">
          <EmailView
            entireEmail={currentEmail}
            uid={uid}
            categories={categories}
          />
        </div>
      </div>
      <div className="absolute bottom-0 z-99 w-full darkblue bg-blend-darken border-t px-5 py-2 text-sm border-gray-700 text-gray-400 flow-root">
        <div className="float-left font-semibold">
          1 to {data.length}{" "}
          <span className="font-normal text-gray-500">of Many</span>
        </div>
        <div className="float-right w-3/4 flex">
          <div className="">
            <span className="font-bold ml-20 mr-3 text-pink-500">
              Categories and Projects:{" "}
            </span>{" "}
            <a
              href="/dash"
              className=" underline hover:no-underline hover:text-blue-400"
            >
              {multiCategory(currentEmail)}
            </a>
          </div>
          <div className="">
            {/* <span className="font-bold ml-20 mr-3 text-orange-500">Projects:</span>  Matcha  */}{" "}
            {/*TODO: Fix This */}
          </div>
        </div>
      </div>
    </div>
  );
}
