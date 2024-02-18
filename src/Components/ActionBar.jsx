import React, { Component } from "react";
import Item from "./Item"
import { useState } from 'react'


export default function ActionBar() {
	
  return (
    <>

      <div className="fixed flex items-center justify-center w-screen">
        <input type="text" className="mt-20 bg-transparent backdrop-blur-2xl border-2 border-gray-700  shadow-2xl py-5  rounded-xl text-white px-5 w-1/3 m-auto !outline-none" >
          
        </input>

      </div>
    </>
  );
}

