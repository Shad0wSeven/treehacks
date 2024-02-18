import React, {useState } from "react";

const formatDate = (timeString) => {
  const options = { hour: 'numeric', hour12: true, month: "short", day: "numeric" }
  const parsedDate = Date.parse(timeString);
  return new Date(parsedDate).toLocaleDateString(undefined, options)
}


function senderReduce(sender) {
	const front = sender.split("<");
	return front[0];
}


export default function ProjectItem({openModal, email}) {
	const [active, setActive] = useState(false);
	const handleClick = () => {
	  setActive((current) => !current);
	};

  return (
    <div className={" border m-3 rounded-xl bg-gray- border-gray-700 pr-5 pl-2 py-2 hover:bg-gray-600 hover:bg-opacity-75 cursor-pointer " }>
      <div className={"flex "}>
        <div className="w-30 h-100 " >
          <button type="button" className={" !outline-none text-white align-middle mb-1 mt-1 font-medium rounded-full text-sm px-2.5 py-2.5 mr-2 " + (active ? "bg-green-700" : "bg-red-700")} onClick={() => {handleClick()}} ></button>
        </div>
		<a onClick={() => openModal(email)}>
        <div className="w-full mt-0.5"> {/*FIXME: This doesn't resize properly*/}
          <div className="flex w-96"> {/*FIXME: This doesn't resize properly*/}

            <div className="w-1/2 font-medium text-gray-300 ">
              {senderReduce(email.matcha.summary)}
            </div>

            <div className="w-1/ text-gray-500 font-light text-right ">
              {formatDate(email.date)}
            </div>

          </div>
        </div>
		</a>
      </div>
    </div>
  );
}