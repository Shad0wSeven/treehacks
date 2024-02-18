import os
import pickle
import requests
import json
import contextlib
import sys
import random
# Flask
from flask import Flask, jsonify, request, send_file
from flask_cors import CORS
# Firebase
import firebase_admin
from firebase_admin import firestore
from firebase_admin import credentials
# Gmail API utils
from googleapiclient.http import BatchHttpRequest
from googleapiclient.discovery import build
from google_auth_oauthlib.flow import InstalledAppFlow, Flow
from google.auth.transport.requests import Request
# for encoding/decoding messages in base64
from base64 import urlsafe_b64decode, urlsafe_b64encode
# for dealing with attachement MIME types
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.image import MIMEImage
from email.mime.audio import MIMEAudio
from email.mime.base import MIMEBase
from mimetypes import guess_type as guess_mime_type
from chardet import detect

# external imports
from gmail import *
from llm import *

app = Flask(__name__)
CORS(app)


@app.route("/")
def hello():
  return jsonify({"message": "Welcome to the Matcha v3 (Beta) API! Now with direct GMAIL implementation!"})


@app.route("/test/<user_id>")
def testUser(user_id):
	service = gmail_authenticate(user_id) #TODO: make sure this is a valid ID once firebase comes into play.
	return jsonify({"status": "success", "message": f"hello {user_id}"})


@app.route("/getid/<user_id>/<message_id>")
def getMessage(user_id, message_id):
	service = gmail_authenticate(user_id) #TODO: make sure this is a valid ID once firebase comes into play.
	message = service.users().messages().get(userId='me', id=message_id).execute()
	with nostdout():
		decoded = read_message(service, message, download=False)
	if decoded["bodyHTML"]:
		try:
			decoded["bodyHTML"] = decoded["bodyHTML"].decode("utf-8")
		except:
			pass
	else:
		decoded["bodyHTML"] = ""
		decoded["bodyText"] = "No Body Text"
	
	return jsonify(decoded)

@app.route("/getraw/<user_id>/<message_id>")
def getRawMessage(user_id, message_id):
	service = gmail_authenticate(user_id) #TODO: make sure this is a valid ID once firebase comes into play.
	message = service.users().messages().get(userId='me', id=message_id).execute()
	return jsonify(message)


@app.route("/getattachment/<user_id>/<message_id>/<attachment_name>")
def getAttachment(user_id, message_id, attachment_name):
	service = gmail_authenticate(user_id) #TODO: make sure this is a valid ID once firebase comes into play.
	message = service.users().messages().get(userId='me', id=message_id).execute()
	with nostdout():
		decoded = read_message(service, message, download=False, attachmentData=True)
	if decoded["Attachments"]: 
		# find the attachment with the given ID
		# print("attachments found")
		for attachment in decoded["Attachments"]:
			if attachment["filename"] == attachment_name:
				try:
					# print("found attachment")
					# print(attachment["data"])
					f = open(attachment["filename"], "wb")
					f.write(attachment["data"])
					f.close()
					file_handle = open(attachment["filename"], "rb")
					os.remove(attachment["filename"])
					return send_file(path_or_file=file_handle, download_name=attachment["filename"], as_attachment=True, mimetype=attachment["mime"])
				except Exception as e:
					print(e)
					return jsonify({"message": "Error downloading attachment"}), 400			
				
	return jsonify({"message": "Attachment not found"}), 400


@app.route("/search/<user_id>/<query>")
def searchMessages(user_id, query):
	service = gmail_authenticate(user_id) #TODO: make sure this is a valid ID once firebase comes into play.
	messages = search_messages(service, query)
	decoded = batchGetMessages(messages, service)
	messageList = batchToList(decoded, service)
	return jsonify(messageList)


@app.route("/search-id/<user_id>/<query>")
def searchMessagesID(user_id, query):
	service = gmail_authenticate(user_id) #TODO: make sure this is a valid ID once firebase comes into play.
	messages = search_messages(service, query)
	return jsonify(messages)


@app.route("/getlatest/<user_id>", defaults={"number": 100}) # maybe do full db download later...
@app.route("/getlatest/<user_id>/<number>")
def getLatest(user_id, number):
	service = gmail_authenticate(user_id) #TODO: make sure this is a valid ID once firebase comes into play.
	messages = service.users().messages().list(userId='me', maxResults=number).execute()
	# print(messages)
	decoded = batchGetMessages(messages["messages"], service)
	messageList = batchToList(decoded, service)
	return jsonify(messageList)

@app.route("/getlatest/<user_id>", defaults={"number": 1000}) 
@app.route("/unlimitedlatest/<user_id>/<number>")
def getUnlimitedLatest(user_id, number):
	service = gmail_authenticate(user_id) #TODO: make sure this is a valid ID once firebase comes into play.
	result = service.users().messages().list(userId='me', maxResults=number).execute()
	messages = [ ]
	if 'messages' in result:
		messages.extend(result['messages'])
	while 'nextPageToken' in result:
		maxNum = int(number) - len(messages)
		if(len(messages) >= int(number)):
			break
		# print("loading messages. . .")
		page_token = result['nextPageToken']
		result = service.users().messages().list(userId='me', maxResults=maxNum, pageToken=page_token).execute()
		if 'messages' in result:
			messages.extend(result['messages'])
	# return jsonify({"messages": len(messages)})
	decoded = batchLargeGetMessages(messages, service)
	return jsonify(decoded)

@app.route("/getpagetoken/<user_id>/<number>")
def getPageToken(user_id, number):
	# keep going until you can get the page token for the last page 
	service = gmail_authenticate(user_id) #TODO: make sure this is a valid ID once firebase comes into play.
	result = service.users().messages().list(userId='me', maxResults=number).execute()
	pt = result['nextPageToken']
	messages = [ ]
	if 'messages' in result:
		messages.extend(result['messages'])
	while 'nextPageToken' in result:
		maxNum = int(number) - len(messages)
		if(len(messages) >= int(number)):
			break
		# print("loading messages. . .")
		page_token = result['nextPageToken']
		pt = page_token
		result = service.users().messages().list(userId='me', maxResults=maxNum, pageToken=page_token).execute()
		if 'messages' in result:
			messages.extend(result['messages'])
	return jsonify({"pageToken": pt})

@app.route("/getnextpage/<user_id>/<page_token>", defaults={"number": 100}) 
@app.route("/getnextpage/<user_id>/<page_token>/<number>")
def getNextPage(user_id, page_token, number):
	service = gmail_authenticate(user_id) #TODO: make sure this is a valid ID once firebase comes into play.
	result = service.users().messages().list(userId='me', pageToken=page_token, maxResults=number).execute()
	messages = [ ]
	if 'messages' in result:
		messages.extend(result['messages'])
	decoded = batchGetMessages(messages, service)
	messageList = batchToList(decoded, service)
	return jsonify(messageList)

#TODO: Make this have next size implementation 
@app.route("/getlatestid/<user_id>", defaults={"number": 10000})
@app.route("/getlatestid/<user_id>/<number>")
def getLatestID(user_id, number):
	service = gmail_authenticate(user_id) #TODO: make sure this is a valid ID once firebase comes into play.
	messages = service.users().messages().list(userId='me', maxResults=number).execute()
	# print(messages)
	return jsonify(messages)


@app.route("/summary/<user_id>/")
def getData(user_id):
	# get the user/summary from the firestore database
	data_ref = db.collection("users").document(user_id)
	doc = data_ref.get()
	if doc.exists:
		return jsonify(doc.to_dict())
	else:
		return jsonify({"message": "No summary found for user"})


@app.route("/getsnippets/<user_id>/")
def getSnippets(user_id):
	data_ref = db.collection("users").document("nh34kFqXlCwBgtLM7But").collection("emailsnippets")
	print(type(db.collection("users")))
	try: 
		snippets = data_ref.get()
		return jsonify([doc.to_dict() for doc in snippets])
	except Exception as e:
		return jsonify({"message": "No snippets found for user", "error": e})


@app.route("/gentoken/<user_id>/")
def genToken(user_id):
	# generate a token with gmail api for the user
	pass


@app.route("/gauth/<user_id>/")
def gauth(user_id):
	# generate a token with gmail api for the user
	return jsonify({"url": new_auth(user_id)[0]})


@app.route("/auth/<user_id>/")
def auth(user_id):
	if(request.args.get('error')):
		return jsonify({"error": request.args.get('error')}), 400
	# get state variable and code variable
	try:
		state = request.args.get('state')
		code = request.args.get('code')
		scope = request.args.get('scope')
		flow = Flow.from_client_secrets_file("credentials.json", scopes=scope, redirect_uri=f'{REDIRECT_URI}/{user_id}/', state=state)
		flow.fetch_token(code=code)
	except Exception as e:
		return jsonify({"error": "invalid authorization, please try again"}), 400
	credentials = flow.credentials
	with open(f'./tokens/{user_id}.pickle', "wb") as token:
		pickle.dump(credentials, token)
	return "You have successfully authenticated! You may now close this window now."


@app.route("/fbsetup/<user_id>/")
def fbSetup(user_id):
	data = {"summary": {"emails": [],"opener": "","quicksummary": ""}}
	db.collection("users").document(user_id).set(data)
	db.collection("users").document(user_id).collection("emailsnippets").document("setup").set({"summary": "ignoredata"})
	return jsonify({"message": "Setup complete for user " + user_id}), 200


@app.route("/addcategory/<user_id>/", methods=["GET", "POST"])
def addCategory(user_id):
	content = request.json	
	if(content == None):
		content = {"color": "#FFFFFF", "desc": "No description provided", "prompt": "No prompt provided", "title": "No title provided", "type": "category", "emails": []}
	db.collection("users").document(user_id).collection("categories").document().set(content)
	
	return jsonify({"message": "Category added for user " + user_id}), 200

@app.route("/modifycategory/<user_id>/<category_id>", methods=["GET", "POST"])
def modifyCategory(user_id, category_id):
	print("here")
	content = request.json	
	if(content == None):
		return jsonify({"error": "No content provided"}), 400
	category_ref = db.collection("users").document(user_id).collection("categories").where("title", "==", category_id)
	category_data = category_ref.get()
	category = category_data[0].to_dict()
	for key in content:
		category[key] = content[key]
	db.collection("users").document(user_id).collection("categories").document(category_data[0].id).set(category)
	return jsonify({"message": "Category modified for user " + user_id}), 200


@app.route("/summarize", methods=["GET", "POST"])
def summarize():
	content = request.json
	if(content == None):
		return jsonify({"error": "No content provided"}), 400
	# summary = summarize()
	text = content["content"]
	if(text == "No Body Text"):
		summary = "No Email Body"
	else:
		summary = summarizeBART(text)
	return jsonify({"summary": summary}), 200


@app.route("/summarizeadd/<user_id>/<message_id>", methods=["GET", "POST"])
def summarizeAdd(user_id, message_id):
	# first check if exists in firebase, and then add if not
	currentSummary = db.collection("users").document(user_id).collection("emailsnippets").document(message_id).get()
	try:
		return jsonify({"summary": currentSummary.to_dict()["summary"]}), 200
	except:
		pass
	
	content = request.json
	if(content == None):
		return jsonify({"message": "No content provided"}), 400
	text = content["content"]
	if(text == "No Body Text"):
		summary = "No Email Body"
	else:
		summary = summarizeBART(text)
		db.collection("users").document(user_id).collection("emailsnippets").document(message_id).set({"summary": summary})
	return jsonify({"summary": summary}), 200


@app.route("/checkdone/<user_id>/<message_id>")
def checkDone(user_id, message_id):
	# check if property done is in the firebase database for user ID if not, return false, if it is return the value
	email = db.collection("users").document(user_id).collection("emailsnippets").document(message_id).get()
	if(email.exists): #TODO: potentially check if this can be done without downloading the entire contents of the email
		email = email.to_dict()
		if("done" in email):
			return jsonify({"done": email["done"]}), 200
		else:
			return jsonify({"done": False}), 200
	else:
		return jsonify({"done": False}), 200

@app.route("/toggledone/<user_id>/<message_id>")
def toggleDone(user_id, message_id):
	# check if property done is in the firebase database for user ID if not, add it, if it is, toggle the value 
	email = db.collection("users").document(user_id).collection("emailsnippets").document(message_id).get()
	if(email.exists): #TODO: potentially check if this can be done without downloading the entire contents of the email
		email = email.to_dict()
		if("done" in email):
			email["done"] = not email["done"]
		else:
			email["done"] = True
		db.collection("users").document(user_id).collection("emailsnippets").document(message_id).set(email)
		return jsonify({"done": email["done"]}), 200
	else:
		# set done as true
		db.collection("users").document(user_id).collection("emailsnippets").document(message_id).set({"done": True})
		return jsonify({"done": True}), 200

@app.route("/getcategories/<user_id>/")
def getCategories(user_id):
	# get the categories from the firestore database
	data_ref = db.collection("users").document(user_id).collection("categories")
	try:
		categories = data_ref.get()
		return jsonify([doc.to_dict() for doc in categories]), 200
	except Exception as e:
		return jsonify({"message": "No categories found for user", "error": e}), 400

@app.route("/uncategorize/<user_id>/<message_id>/<category_id>/")
def uncategorize(user_id, message_id, category_id):
	# remove the category from the email in the firestore database
	print(user_id, message_id, category_id)
	# search for category with title category_id
	category_ref = db.collection("users").document(user_id).collection("categories").where("title", "==", category_id)
	category_data = category_ref.get()
	if(len(category_data) == 0):
		return jsonify({"message": "Category not found for user"}), 400
	category = category_data[0].to_dict()
	# remove the category from the email
	
	# remove email from category
	category["emails"].remove(message_id)
	db.collection("users").document(user_id).collection("categories").document(category_data[0].id).set(category)
	return jsonify({"message": "Category removed from email"}), 200


@app.route("/categorize/<user_id>/<message_id>/<category_id>/")
def categorize(user_id, message_id, category_id):
	# add the category to the email in the firestore database
	print(user_id, message_id, category_id)
	# search for category with title category_id
	category_ref = db.collection("users").document(user_id).collection("categories").where("title", "==", category_id)
	category_data = category_ref.get()
	if(len(category_data) == 0):
		return jsonify({"message": "Category not found for user"}), 400
	category = category_data[0].to_dict()
	# add the category to the email
	
	# add email to category
	if message_id not in category["emails"]:
		category["emails"].append(message_id)
	db.collection("users").document(user_id).collection("categories").document(category_data[0].id).set(category)

	# db.collection("users").document(user_id).collection("emailsnippets").document(message_id).set({"category": category_id}, merge=True)
	return jsonify({"message": "Email categorized"}), 200

if __name__ == "__main__":  # Makes sure this is the main process
	app.run( # Starts the site
		host='0.0.0.0',  # Establishes the host, required for repl to detect the site
		port=random.randint(2000, 9000)  # Randomly select the port the machine hosts on.
		)

