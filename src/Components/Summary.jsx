import React, {useState, useEffect} from "react";
import { Link } from "react-router-dom";


export default function Summary(props) {
	
	console.log(props.meta.summary);
	console.log(props);
    const data = props.data;
	var emails;
	if(false) {
		emails = props.meta.summary.emails.map(email => (
			<div className=" w-full px-5 py-2 rounded-xl border border-transparent mb-3 hover:border-gray-400" key={email}>
			<Link to={"/?uuid=" + email}>
				<h3 className="text-white font-semibold text-xl">{data[email].subject}</h3>
				<p className="text-gray-400 font-md">{data[email].matcha.summary}</p>
			</Link>
			</div>
		));
	} else {
		emails = <p className="text-white">No emails found</p>
	}

  return (
    <>
      <div className="fixed h-full w-screen backdrop-blur-lg p-20">
        <h2 className="text-2xl font-semibold text-white">{props.meta.summary.opener}</h2>
        <p className="mt-5 text-white">{props.meta.summary.quicksummary}</p>
        <div className="grid justify-items-center px-10 mt-10">
          {emails}
          <button className="text-red-500 mt-3 border-red-700 border px-3 py-1 rounded-lg hover:bg-red-900" onClick={() => props.close()}>Close</button>
        </div>
      </div>
    </>
  );
}