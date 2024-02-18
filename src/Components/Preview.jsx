import { parse } from "postcss";
import React, {useState, useEffect} from "react";
import CheckBoxOutlineBlankIcon from '@mui/icons-material/CheckBoxOutlineBlank';
import StarIcon from '@mui/icons-material/StarOutlined';
import LabelOutlinedIcon from '@mui/icons-material/LabelOutlined';
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined';


const isToday = (someDate) => {
	const today = new Date()
	return someDate.getDate() == today.getDate() &&
	  someDate.getMonth() == today.getMonth() &&
	  someDate.getFullYear() == today.getFullYear()
  }

const formatDate = (timeString) => {
	
  const options = {  month: "short", day: "numeric" }

  const todayOptions = { hour: 'numeric', hour12: true }

  const parsedDate = Date.parse(timeString)
  if(isToday(new Date(parsedDate))){
	
	  return new Date(parsedDate).toLocaleTimeString(undefined, todayOptions);
	  
  }
  return new Date(parsedDate).toLocaleDateString(undefined, options);
}


function senderReduce(sender) {
	const front = sender.split("<");
	return front[0];
}

export default function Preview(props) {
	// console.log(props.labels);
	// search props.label for somethign starting with CATEGORY_ and save the end part
	const [category , setCategory] = useState();
	const [unread, setUnread] = useState(false);
	const [starred, setStarred] = useState(false);

	const isStarred = props.labels.find((label) => label === "STARRED");
	if(isStarred){
		if(!starred) {
			setStarred(true);
		}
	}

	const isUnread = props.labels.find((label) => label === "UNREAD");
	if(isUnread){
		if(!unread) {
			setUnread(true);
		}
	}
	const categoryTitle = props.labels.find((label) => label.startsWith("CATEGORY_"));
	// remove CATEGORY_ from the start of the string
	// THen make it lowercase with first letter uppercase with 
	

	if(categoryTitle){
		let formattedCategoryTitle = categoryTitle.slice(9).charAt(0).toUpperCase() + categoryTitle.slice(10).toLowerCase();
		// console.log(formattedCategoryTitle);
		if(!category) {
			setCategory(formattedCategoryTitle);
		}
	}
	// console.log(categoryTitle);
  return (
    <div className={`border-b border-gray-700 hover:bg-gray-600 hover:bg-opacity-75 group `}>
		
      <div className="wrapper pr-2 pl-4 py-3 cursor-pointer flex   ">
        {/* <div className="rounded-full mr-2 grow h-10 bg-red-300 px-5 "/> */}
		<div className=" hover:visible">
		<div>
		<CheckBoxOutlineBlankIcon className="text-gray-300 mr-2 block"/>
		</div>
		<div className="mt-1">

		{starred && <StarIcon className="text-yellow-500 mr-2 block"/>}
		{unread && (<div className="bg-blue-400 h-2 w-2  rounded-full mt-2 ml-2"></div>)}



		</div>


		</div>
		
        <div className="w-full pr-12">
          <div className="flex mb-1 ">
            <div className="w-4/5"><p style={{whiteSpace: "nowrap"}} className=" text-sm truncate  text-gray-300">{senderReduce(props.from)} </p></div>
            <div className="w-1/5"><p className="text-sm text-gray-500 text-right ">{formatDate(props.time)}</p></div>
          </div>
          <h2 className=" font-medium text-ellipsis truncate mb-1 text-white ">{props.subject}</h2>
		  {category && <div className="flex"> <h3 className=" text-sm text-ellipsis truncate text-gray-400">{props.body}</h3> <p className="text-xs text-gray-400 mb-1 bg-gray-700 py-0.6 px-1 rounded">{category}</p> </div>}
		  {!category && <h3 className=" text-sm text-ellipsis truncate text-gray-400">{props.body}</h3>}
          
        </div>
      </div>
    </div>
  );
}