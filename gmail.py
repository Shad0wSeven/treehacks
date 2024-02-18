import os
import pickle
import requests
import json
import contextlib
import sys
import random
from dotenv import load_dotenv
from os.path import join, dirname
# Flask
from flask import Flask, jsonify, request
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


dotenv_path = join(dirname(__file__), '.env')
load_dotenv(dotenv_path)



REDIRECT_URI = os.environ.get("REDIRECT_URI")
VERBOSE = True # turn off for production

class DummyFile(object):
	def write(self, x): pass

@contextlib.contextmanager
def nostdout():
	save_stdout = sys.stdout
	sys.stdout = DummyFile()
	yield
	sys.stdout = save_stdout
	# pass

# Initialize Firestore DB
cred = credentials.Certificate('firebase.json')
firebase_admin.initialize_app(cred)
db = firestore.client()


# Request all access (permission to read/send/receive emails, manage the inbox, and more)
SCOPES = ['https://mail.google.com/']
our_email = 'your_gmail@gmail.com'

# Creates a service object and returns it
def gmail_authenticate(user_id='token'):
	print("authenticating")
	creds = None
	# the file token.pickle stores the user's access and refresh tokens, and is
	# created automatically when the authorization flow completes for the first time
	if os.path.exists(f'./tokens/{user_id}.pickle'):
		with open(f'./tokens/{user_id}.pickle', "rb") as token:
			creds = pickle.load(token)
	# if there are no (valid) credentials available, let the user log in.
	if not creds or not creds.valid:
		if creds and creds.expired and creds.refresh_token and False:
			creds.refresh(Request())
		else:
			flow = InstalledAppFlow.from_client_secrets_file('credentials.json', SCOPES)
			creds = flow.run_local_server(port=0) #TODO: Make this not local
		# save the credentials for the next run
		with open(f'./tokens/{user_id}.pickle', "wb") as token:
			pickle.dump(creds, token)
	return build('gmail', 'v1', credentials=creds)


def new_auth(user_id):
	flow = Flow.from_client_secrets_file("credentials.json", scopes=SCOPES, redirect_uri=f'{REDIRECT_URI}/{user_id}/')
	auth_url = flow.authorization_url()
	return auth_url

# Adds the attachment with the given filename to the given message
def add_attachment(message, filename):
	content_type, encoding = guess_mime_type(filename)
	if content_type is None or encoding is not None:
		content_type = 'application/octet-stream'
	main_type, sub_type = content_type.split('/', 1)
	if main_type == 'text':
		fp = open(filename, 'rb')
		msg = MIMEText(fp.read().decode(), _subtype=sub_type)
		fp.close()
	elif main_type == 'image':
		fp = open(filename, 'rb')
		msg = MIMEImage(fp.read(), _subtype=sub_type)
		fp.close()
	elif main_type == 'audio':
		fp = open(filename, 'rb')
		msg = MIMEAudio(fp.read(), _subtype=sub_type)
		fp.close()
	else:
		fp = open(filename, 'rb')
		msg = MIMEBase(main_type, sub_type)
		msg.set_payload(fp.read())
		fp.close()
	filename = os.path.basename(filename)
	msg.add_header('Content-Disposition', 'attachment', filename=filename)
	message.attach(msg)

def build_message(destination, obj, body, attachments=[]):
	if not attachments: # no attachments given
		message = MIMEText(body)
		message['to'] = destination
		message['from'] = our_email
		message['subject'] = obj
	else:
		message = MIMEMultipart()
		message['to'] = destination
		message['from'] = our_email
		message['subject'] = obj
		message.attach(MIMEText(body))
		for filename in attachments:
			add_attachment(message, filename)
	return {'raw': urlsafe_b64encode(message.as_bytes()).decode()}

def send_message(service, destination, obj, body, attachments=[]):
	return service.users().messages().send(
	  userId="me",
	  body=build_message(destination, obj, body, attachments)
	).execute()

def search_messages(service, query):
	result = service.users().messages().list(userId='me',q=query).execute()
	messages = [ ]
	if 'messages' in result:
		messages.extend(result['messages'])
	while 'nextPageToken' in result:
		print("loading messages. . .")
		page_token = result['nextPageToken']
		result = service.users().messages().list(userId='me',q=query, pageToken=page_token).execute()
		if 'messages' in result:
			messages.extend(result['messages'])
	return messages

# utility functions
def get_size_format(b, factor=1024, suffix="B"):
	"""
	Scale bytes to its proper byte format
	e.g:
		1253656 => '1.20MB'
		1253656678 => '1.17GB'
	"""
	for unit in ["", "K", "M", "G", "T", "P", "E", "Z"]:
		if b < factor:
			return f"{b:.2f}{unit}{suffix}"
		b /= factor
	return f"{b:.2f}Y{suffix}"


def clean(text):
	# clean text for creating a folder
	return "".join(c if c.isalnum() else "_" for c in text)



#FIXME: This is a very jank solution to passing data from parse_parts LOL
bodyAttach = {}
bodyAttach['Attachments'] = []
bodyAttach['bodyText'] = None
bodyAttach['bodyHTML'] = None

def parse_parts(service, parts, folder_name, message, download=False, attachmentData=False):
	"""
	Utility function that parses the content of an email partition
	"""

	if parts:
		for part in parts:
			filename = part.get("filename")
			mimeType = part.get("mimeType")
			body = part.get("body")
			data = body.get("data")
			file_size = body.get("size")
			part_headers = part.get("headers")

			if part.get("parts"):
				# recursively call this function when we see that a part
				# has parts inside
				parse_parts(service, part.get("parts"), folder_name, message)
			if mimeType == "text/plain":
				# if the email part is text plain
				if data:
					text = urlsafe_b64decode(data).decode()
					print(text)
					bodyAttach['bodyText'] = text
			elif mimeType == "text/html":
				# if the email part is an HTML content
				# save the HTML file and optionally open it in the browser
				if not filename:
					filename = "index.html"
				filepath = os.path.join(folder_name, filename)
				print("Saving HTML to", filepath)
				try:
					bodyAttach['bodyHTML'] = urlsafe_b64decode(data).decode()
				except:
					bodyAttach['bodyHTML'] = ""
					print(data)
				if download:
					with open(filepath, "wb") as f:
						f.write(urlsafe_b64decode(data))
			else:
				# attachment other than a plain text or HTML
				for part_header in part_headers:
					part_header_name = part_header.get("name")
					part_header_value = part_header.get("value")
					if part_header_name == "Content-Disposition":
						if "attachment" in part_header_value:
							# we get the attachment ID 
							# and make another request to get the attachment itself
							print("Saving the file:", filename, "size:", get_size_format(file_size))
							returnData = {}
							
							returnData["filename"] = filename
							attachment_id = body.get("attachmentId")
							attachment = service.users().messages() \
										.attachments().get(id=attachment_id, userId='me', messageId=message).execute()
							data = attachment.get("data")
							filepath = os.path.join(folder_name, filename)
							if data:
								if attachmentData:
									returnData["data"] = urlsafe_b64decode(data)
								else:
									returnData["data"] = None
								returnData["size"] = get_size_format(file_size)
								returnData["id"] = attachment_id
								returnData["mime"] = mimeType
								bodyAttach['Attachments'].append(returnData)
								if download:
									with open(filepath, "wb") as f:
										f.write(urlsafe_b64decode(data))
			# print(bodyAttach)
			# print("Done parsing this part")
	# return bodyAttach


									
def read_message(service, message, download=False, subfolder="emails", attachmentData=False):
	#TODO: realize that message is currently set as an ID
	# print(message)

	bodyAttach['Attachments'] = []
	bodyAttach['bodyText'] = None
	bodyAttach['bodyHTML'] = None

	result = {}
	result['labels'] = []
	result['bodyText'] = "No Text in this Email"
	result['bodyHTML'] = "No HTML in this Email"
	result['Attachments'] = []
	result['id'] = message['id']
	result['threadId'] = message['threadId']
	result['subject'] = 'No Subject'
	result['date'] = 'Invalid Date'
	result['from'] = 'No Sender'
	result['to'] = 'No Recipient'
	"""
	This function takes Gmail API `service` and the given `message_id` and does the following:
		- Downloads the content of the email
		- Prints email basic information (To, From, Subject & Date) and plain/text parts
		- Creates a folder for each email based on the subject
		- Downloads text/html content (if available) and saves it under the folder created as index.html
		- Downloads any file that is attached to the email and saves it in the folder created
	"""
	msg = message
	# parts can be the message body, or attachments
	payload = msg['payload']
	headers = payload.get("headers")
	parts = payload.get("parts")
	labels = msg['labelIds']
	if labels:
		result['labels'] = labels
	folder_name = "email"
	has_subject = False
	if headers:
		# this section prints email basic info & creates a folder for the email
		for header in headers:
			name = header.get("name")
			value = header.get("value")
			if name.lower() == 'from':
				# we print the From address
				print("From:", value)
				result['from'] = value
			if name.lower() == "to":
				# we print the To address
				print("To:", value)
				result['to'] = value
			if name.lower() == "subject":
				# make our boolean True, the email has "subject"
				has_subject = True
				# make a directory with the name of the subject
				folder_name = clean(value)
				# we will also handle emails with the same subject name
				folder_counter = 0
				while os.path.isdir(folder_name):
					folder_counter += 1
					# we have the same folder name, add a number next to it
					if folder_name[-1].isdigit() and folder_name[-2] == "_":
						folder_name = f"{folder_name[:-2]}_{folder_counter}"
					elif folder_name[-2:].isdigit() and folder_name[-3] == "_":
						folder_name = f"{folder_name[:-3]}_{folder_counter}"
					else:
						folder_name = f"{folder_name}_{folder_counter}"
				if download : os.mkdir(folder_name)
				print("Subject:", value)
				result['subject'] = value
			if name.lower() == "date":
				# we print the date when the message was sent
				print("Date:", value)
				result['date'] = value
	if not has_subject:
		# if the email does not have a subject, then make a folder with "email" name
		# since folders are created based on subjects
		if not os.path.isdir(folder_name) and download:
			os.mkdir(folder_name)
	parse_parts(service, parts, folder_name, message['id'], download=download, attachmentData=attachmentData)
	potentialBody = payload.get("body")
	if potentialBody:
		# decode the data of body into a string
		data = potentialBody.get("data")
		if data:
			body = urlsafe_b64decode(data).decode()
			print(body)
			bodyAttach['bodyHTML'] = body
	result['bodyText'] = bodyAttach['bodyText']
	result['bodyHTML'] = bodyAttach['bodyHTML']
	result['Attachments'] = bodyAttach['Attachments']

	
	print("="*50)
	
	return result


def returnMessage(message, service):
	with nostdout():
		x = read_message(service, message, download=False)
	# print(z["bodyHTML"])
	x["bodyHTML"] = x["bodyHTML"].decode("utf-8")
	y = {x["id"]: x}
	z = json.dumps(y, indent=4)
	return z


def divide_chunks(l, n):
    # looping till length l
    for i in range(0, len(l), n): 
        yield l[i:i + n]


#FIXME: This function only accepts 100 messages max, this needs to be fixed/updated for better search.
def batchGetMessages(messages, service):
	batch = service.new_batch_http_request()
	for message in messages[0:100]:
		batch.add(service.users().messages().get(userId='me', id=message['id'], format='full'))
	batch.execute()
	return batch


def batchLargeGetMessages(messages, service): # note: this could exceed api limits
	z = []
	for chunk in divide_chunks(messages, 100):
		batch = service.new_batch_http_request()
		for message in chunk:
			batch.add(service.users().messages().get(userId='me', id=message['id'], format='full'))
		batch.execute()
		z.append(batchToList(batch, service))
	return z

def batchToList(decoded, service):
	messageList = []
	for request_id in decoded._order:
		resp, content = decoded._responses[request_id]
		message = json.loads(content)
		with nostdout():
			parsed = read_message(service, message, download=False)
		if(parsed["bodyHTML"] != None):
			try:
				parsed["bodyHTML"] = parsed["bodyHTML"].decode("utf-8")
			except:
				pass
		messageList.append(parsed)
		#handle your message here, like a regular email object
	return messageList
		