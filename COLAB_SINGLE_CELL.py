# Baseball 3D - Colab 단일 실행 셀
# 1) 아래 REPO_URL을 본인 GitHub 저장소 주소로 바꾼 뒤 실행
# 2) Colab 출력 영역 안에서 게임이 열림

REPO_URL = "https://github.com/YOUR_ID/baseball3d.git"
BRANCH = "main"
PORT = 5173

import os, subprocess, time, shutil
from pathlib import Path
from IPython.display import display, HTML

work = Path("/content/baseball3d")
if work.exists():
    shutil.rmtree(work)

subprocess.run(["git", "clone", "--depth", "1", "-b", BRANCH, REPO_URL, str(work)], check=True)
os.chdir(work)

subprocess.run(["npm", "install"], check=True)
proc = subprocess.Popen(
    ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", str(PORT)],
    stdout=subprocess.DEVNULL,
    stderr=subprocess.STDOUT
)
time.sleep(2)

try:
    from google.colab import output
    output.serve_kernel_port_as_iframe(PORT, height=760)
except Exception as e:
    print("Colab iframe 실행 실패:", e)
    print("대안: output.serve_kernel_port_as_window(PORT)")
