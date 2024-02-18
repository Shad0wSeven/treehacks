import React, {useState, useEffect} from "react";
import { Link } from "react-router-dom";

const formatDate = (dateString) => {
  const options = { hour: 'numeric', hour12: true, month: "short", day: "numeric" }
  return new Date(dateString).toLocaleDateString(undefined, options)
}


export default function Modal(props) {
	const apiurl = import.meta.env.VITE_API_URL;
	// console.log(apiurl);
	const [summary, setSummary] = useState();
	const [active, setActive] = useState(false);
	const uid = props.uid;
	const categoryTitle = props.category;
	useEffect(() => {
		if (uid) {
			setSummary("Loading...");
			let payload = {"content": props.email.bodyText}
			fetch(`${apiurl}/summarizeadd/${uid}/${props.email.id}`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json"
				},
				body: JSON.stringify(payload)
			})
			.then((response) => response.json())
			.then((data) => {
				// console.log(data);
				setSummary(data.summary);
			}
			)
		}
	}, [uid]);

	useEffect(() => {
		if (uid) {
			// go to http://127.0.0.1:5000/checkdone/ to check if email is done
			fetch(`${apiurl}/checkdone/${uid}/${props.email.id}`)
			.then((response) => response.json())
			.then((data) => {
				// console.log(data);
				setActive(data.done);
			}
			)
		}
	}, [uid]);
	
	const handleClick = () => {
		// go to http://127.0.0.1:5000/toggledone/ to toggle done
		fetch(`${apiurl}/toggledone/${uid}/${props.email.id}`)
		.then((response) => response.json())
		.then((data) => {
			console.log(data);
		}
		)
	  setActive((current) => !current);
	};

	const uncategorize = () => {
		// go to http://127.0.0.1:5000/uncategorize/
		fetch(`${apiurl}/uncategorize/${uid}/${props.email.id}/${categoryTitle}`)
		.then((response) => response.json())
		.then((data) => {
			console.log(data);
		}
		)
	}

  return (
    <>

      <div className="centered w-2/3 px-5 py-3  mt-20  rounded-xl backdrop-blur-lg border border-gray-700 shadow-2xl">
	  <button className="text-green-500 hover:text-green-700 font-semibold mb-3 mr-2" onClick={() => handleClick()}>Mark {!active && "Done"} {active && "not Done"}</button>
	  <button className="text-red-500 hover:text-red-700 font-semibold mb-3 mr-2" onClick={() => props.close()}>Delete</button>
	  {/* <button className="text-yellow-500 hover:text-yellow-700 font-semibold mb-3 mr-2" onClick={() => props.close()}>Archive</button> */}
	  <button className="text-yellow-500 hover:text-yellow-700 font-semibold mb-3 mr-2" onClick={() => uncategorize()}>Remove from Category</button>
        <h2 className="text-2xl font-semibold text-white">{props.email.subject}</h2>
        <p className="mt-5 text-white">{summary} </p>
		
        <div className="grid justify-items-center px-10 mt-10">

			<div className="flex gap-x-5">

			

          <Link to={"/?uuid=" + props.email.id} className="hover:bg-gray-700 hover:opacity-70  w-20 border text-white block font-bold text-center py-2 px-4 rounded"
          >
            View</Link>
          <button className="text-red-500 hover:text-red-700" onClick={() => props.close()}>Close</button>
		  </div>



        </div>

      </div>

    </>
  );
}