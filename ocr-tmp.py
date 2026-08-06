import json, os, requests, sys, time

JOB_URL = "https://paddleocr.aistudio-app.com/api/v2/ocr/jobs"
TOKEN = "ac1da5ad6456a64abd0363a7edb03b218f1d9c51"
MODEL = "PaddleOCR-VL-1.6"
file_path = "D:/projects/ggbpuppy/ollama_shot.png"

headers = {"Authorization": f"bearer {TOKEN}"}
optional_payload = {"useDocOrientationClassify": False, "useDocUnwarping": False, "useChartRecognition": False}
data = {"model": MODEL, "optionalPayload": json.dumps(optional_payload)}
with open(file_path, "rb") as f:
    files = {"file": f}
    job_response = requests.post(JOB_URL, headers=headers, data=data, files=files)
if job_response.status_code != 200:
    print("submit fail", job_response.status_code, job_response.text); sys.exit(1)
jobId = job_response.json()["data"]["jobId"]
print("job", jobId)
while True:
    r = requests.get(f"{JOB_URL}/{jobId}", headers=headers)
    state = r.json()["data"]["state"]
    if state == 'done':
        jsonl_url = r.json()['data']['resultUrl']['jsonUrl']
        break
    elif state == 'failed':
        print("failed", r.json()['data'].get('errorMsg')); sys.exit(1)
    time.sleep(5)
jsonl = requests.get(jsonl_url).text
for line in jsonl.strip().split('\n'):
    if not line.strip():
        continue
    res = json.loads(line)["result"]
    for lr in res.get("layoutParsingResults", []):
        print(lr["markdown"]["text"])
