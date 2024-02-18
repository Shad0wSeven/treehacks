import json
import requests

# hf api
GPT_2_API_URL = "https://api-inference.huggingface.co/models/gpt2"
GPT_2_L_API_URL = "https://api-inference.huggingface.co/models/gpt2-large"
GPT_2_XL_API_URL = "https://api-inference.huggingface.co/models/gpt2-xl"
BART_API_URL = "https://api-inference.huggingface.co/models/facebook/bart-large-cnn"
headers = {"Authorization": f"Bearer {API_TOKEN}"}


def queryGPT2(payload):
    """
	Raw GPT2 API query
	"""
    data = json.dumps(payload)
    response = requests.request("POST", GPT_2_API_URL, headers=headers, data=data)
    return json.loads(response.content.decode("utf-8"))

def queryBART(payload):
	"""
	Raw BART API query
	"""
	data = json.dumps(payload)
	response = requests.request("POST", BART_API_URL, headers=headers, data=data)
	return json.loads(response.content.decode("utf-8"))

def summarizeBART(text):
	"""
	Returns a Summary with BART
	"""
	payload = {"inputs": text, "parameters": {"do_sample": False},}
	data = queryBART(payload)
	return data[0]["summary_text"]
