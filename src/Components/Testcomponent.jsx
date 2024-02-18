import React, { Component, useEffect, useState } from "react";
import Item from "./Item"


export default function Testcomponent(props) {
	const [emails , setEmails] = useState();
	

	useEffect(() => {
		setEmails(props.data.emails);
		// setTimeout(()=>{
		// 	setEmails(props.data.fullEmails);
		//    }, 1000);
		// console.log(props.data.fullEmails);
	}, []);
	
	// console.log(props.data.fullEmails.length);
	// console.log(props.data)
	if(!emails) {
		return ("loading");
	}
  return (
    <>

      <div className="text-white">

          {emails.map((email) => (
			<div key={email}>{email}</div>)
			)}


      </div>
    </>
  );
}

