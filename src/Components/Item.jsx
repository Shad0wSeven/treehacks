import React, {useState, useEffect } from "react";

const formatDate = (timeString) => {
  const options = { hour: 'numeric', hour12: true, month: "short", day: "numeric" }
  const parsedDate = Date.parse(timeString);
  return new Date(parsedDate).toLocaleDateString(undefined, options)
}


function senderReduce(sender) {
	const front = sender.split("<");
	return front[0];
}


export default function Item({openModal, email, uid, categoryTitle}) {
	const apiurl = import.meta.env.VITE_API_URL;
	// console.log(apiurl);
	const [active, setActive] = useState(false);
	useEffect(() => {
		if (uid) {
			// go to http://127.0.0.1:5000/checkdone/ to check if email is done
			fetch(`${apiurl}/checkdone/${uid}/${email.id}`)
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
		fetch(`${apiurl}/toggledone/${uid}/${email.id}`)
		.then((response) => response.json())
		.then((data) => {
			// console.log(data);
		}
		)
	  setActive((current) => !current);
	};

  return (
    <div className={" border-t border-gray-700 pr-5 pl-2 py-2 hover:bg-gray-600 hover:bg-opacity-75 cursor-pointer " }>
      <div className={"flex "}>
        <div className="" >
          <button type="button" className={" !outline-none text-white    font-medium rounded-full text-sm px-2.5 py-2.5 mr-2 " + (active ? "bg-green-700" : "bg-red-700")} onClick={() => {handleClick()}} ></button>
        </div>
		<div className="w-full">
		<a className="w-full" onClick={(
		) => openModal(email, categoryTitle)}>
        <div className="w-full"> 
          <div className="w-full h-6">

            <div className="float-left font-medium text-gray-300 ">
              {senderReduce(email.from)}
            </div>

            <div className="float-right text-gray-500 font-light text-right ">
              {formatDate(email.date)}
            </div>

          </div>
          <div className="text-white ">
            {email.subject}
          </div>
        </div>
		</a>
		</div>
      </div>
    </div>
  );
}